# API gaps blocking web deposits

This file tracks the work in `api-speed-survivor` required for the web
wallet's Coinflow deposit flow to credit user wallets in production.

**Status:** Gaps 1, 2, 3, and 5 below are fixed in the local checkout
of `api-speed-survivor`. Gaps 1–3 have already been deployed (verified
by a `200 OK` on the production webhook URL). Gap 5 needs a deploy and
a one-line data check first (see below). Gap 4 is open and needs a
product decision.

## Gap 1 — `hooks` router was not mounted ✅ FIXED

The webhook handler that credits `wallet.deposits` lives at
`api-speed-survivor/api/v1/hooks/router.py`, but `main.py` did not call
`include_router` on it. Result: `POST /webhooks/payments/settlement`
never reached the handler. Confirmed against production
(`speed-survivor-api-3xewp.ondigitalocean.app`) by hitting both the
real path and a known-fake path — both returned identical
`401 TOKEN_INVALID`, which means the request was being rejected by the
auth middleware before any router even resolved.

### Fix applied

`api-speed-survivor/main.py` now imports and mounts the router:

```python
from api.v1.hooks.router import router as hooks_router
...
app.fastapi.include_router(hooks_router)
```

## Gap 2 — `/webhooks/*` was not in the auth public-paths whitelist ✅ FIXED

`api-speed-survivor/api/middleware/authentication.py:_is_public_endpoint`
runs **before** route resolution and rejects any request without a valid
`Bearer <jwt>` header unless the path matches one of `public_prefixes`.
`/webhooks/*` was not in the list. Coinflow can't send a JWT — its only
auth mechanism for outbound webhooks is the `?token=` query string the
handler validates. So even with the router mounted, every callback would
have 401'd in the middleware before the handler ran.

### Fix applied

Added `/webhooks` to the `public_prefixes` list. The handler still
validates the per-call token with `hmac.compare_digest`, so this only
opens the path to *reach* the handler; it doesn't make the endpoint
itself unauthenticated.

## Gap 3 — `WEBHOOK_KEY` was hardcoded in source ✅ FIXED

`api-speed-survivor/api/v1/hooks/router.py` had a module-level constant
`WEBHOOK_KEY = "dbf49..."` checked into version control. That makes
rotation a code-deploy event and any leak (chat history, screenshot,
git fork) compromises the secret permanently.

### Fix applied

The router now reads the value from `os.getenv("COINFLOW_WEBHOOK_TOKEN")`
and raises a `RuntimeError` at import time if unset, so a misconfigured
deploy crashes loud instead of 401'ing every callback silently. The
existing value has been moved into `api-speed-survivor/.env` and
`api-speed-survivor/env.sh` for local dev.

### Required follow-up before launch

The previously-hardcoded token value must be considered compromised.
Before any real money flows:

1. Generate a new token in the Coinflow merchant dashboard (or rotate
   the existing one).
2. Update the value in DigitalOcean's app-platform env config for the
   API service.
3. Update `.env` and `env.sh` locally.
4. Update the webhook URL in the Coinflow dashboard so the `?token=`
   query string matches.

## Gap 4 — Bonus logic compares against wrong scale 🟡 OPEN

In `api/v1/hooks/router.py`:

```python
package_coins: int | None = webhook_info.get("coins")
if package_coins == 50:
    coins += math.ceil(coins * 0.10)
elif package_coins == 100:
    coins += math.ceil(coins * 0.15)
elif package_coins == 250:
    coins += math.ceil(coins * 0.25)
```

The web app sends `webhookInfo.coins = subtotalCents`
(see `web-speed-survivor/lib/coinflow.ts` and
`web-speed-survivor/components/deposit/CoinflowEmbed.tsx`), so a $50
deposit ships `coins: 5000` and the bonus branch never matches. Same for
the embedded SDK flow.

### Decision needed

Either:
- (a) Drop the bonus tiers entirely. Cleanest — matches the current
  package picker, which has no bonus badges and treats every package as
  equal weight (per `PRODUCT.md`'s "one spine, one accent" rule).
- (b) Fix the comparisons to match cents (`== 5000`, `== 10000`,
  `== 25000`) and add the corresponding `$200` / `$500` tiers from the
  picker, then surface the bonus visually in `PackagePicker.tsx`.

Recommendation: (a). Bonus tiers were on the explicit anti-reference
list when we redesigned the picker.

## Gap 5 — Wallet read endpoints filter by Firebase UID instead of `account_uuid` ✅ FIXED

This was originally written as informational. Production logs from the
first end-to-end deposit attempt showed it was actually blocking: the
`POST /webhooks/payments/settlement` returned `200 OK` (router was
mounted, route was reachable, token was valid), but a subsequent
`GET /api/v1/wallet/transactions` returned `0 of 0 transactions` for
the same user.

The audit log showed `account_uuid=f6d58c68-1ca9-4265-9f5d-209d796aac6e`
on the request, while the transactions service log showed
`Fetching transactions for user VDvXVbtKlnXApohiWh4WocQDjwb2` — a
Firebase UID, not a UUID.

### Root cause

`api/v1/wallet/router.py:get_balance` and `get_transactions` were both
passing `auth_user.uid` (the Firebase UID from the JWT) into the
balance / transaction services. Those services issue queries like:

```sql
SELECT user_uuid, SUM(amount)
FROM wallet.deposits
WHERE user_uuid = %s  -- column holds account_uuid values
```

and the balance query also has:

```sql
WHERE u.account_uuid = %s
```

The SQL has always assumed `account_uuid`. The webhook handler also
writes `account_uuid` into `wallet.deposits.user_uuid` (via Coinflow's
`data.rawCustomerId`, which the web app sets to the user's
`account_uuid`). The router was the only piece passing the wrong
identifier — silently returning `0` and `[]` for every user, since the
mobile app never had a working deposit flow that would have surfaced it.

### Fix applied

Both endpoints now resolve the `account_uuid` from the JWT's Firebase
UID before calling the service, using the same `_get_account_uuid`
helper that the audit logger was already using. If the lookup returns
nothing (deleted or unknown account), the endpoint returns `401`
instead of silently 0. The audit-log call in `get_balance` was also
deduplicated — it used to do a second `_get_account_uuid` lookup of
its own.

```python
account_uuid = await run_sync(_get_account_uuid, orm, auth_user.uid)
if not account_uuid:
    raise HTTPException(status_code=401, detail="Account not found")
balance = await run_sync(service.get_balance, account_uuid)
```

### Watch-out on deploy

If any pre-existing rows in `wallet.deposits` or `wallet.withdrawals`
were ever populated with a Firebase UID in the `user_uuid` column
(e.g. by a legacy job or a one-off backfill), this change makes them
invisible — they'll still be in the table but the new account_uuid
filter won't match them. A quick pre-deploy check is worth running:

```sql
SELECT count(*)
FROM wallet.deposits d
LEFT JOIN users.accounts a ON a.account_uuid = d.user_uuid
WHERE a.account_uuid IS NULL;
```

If that returns `0`, every existing deposit is already keyed by a
valid `account_uuid` and the deploy is safe. If it returns `> 0`,
those rows need a backfill (`UPDATE wallet.deposits SET user_uuid =
a.account_uuid FROM users.accounts a WHERE a.firebase_uid =
wallet.deposits.user_uuid;`) before the new code goes live.

## Webhook configuration in Coinflow dashboard

Once the `api-speed-survivor` changes are deployed:

- URL: `https://speed-survivor-api-3xewp.ondigitalocean.app/webhooks/payments/settlement?token=<rotated-token>`
- Events: `Settled` (category `Purchase`) — already what the handler
  filters on; everything else returns `200 {"message": "Ignored event"}`.
- Signature: not used; auth is the `?token=` query string only.

### Smoke test

After deploy, the following should return `200` with
`{"success": true, "message": "Ignored event"}` (proving the route is
reachable, the public-prefix bypass works, and the token check passes):

```sh
curl -i -X POST \
  "https://speed-survivor-api-3xewp.ondigitalocean.app/webhooks/payments/settlement?token=$COINFLOW_WEBHOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventType":"Ignored","category":"Other"}'
```

If you instead get `401 TOKEN_INVALID`, the `/webhooks` public-prefix
change didn't deploy. If you get `401 Invalid token`, the request *did*
reach the handler but the token doesn't match the env value.
