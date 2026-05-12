# Withdrawals — phase 2 design

This document is the contract between the web app and the API team for the
withdrawal flow. It is the spec for an upcoming PR against
`api-speed-survivor` and a corresponding follow-up PR here.

## User flow

```
Wallet
  -> "Withdraw"
  -> KYC check
       -> if not verified: KYC widget (Coinflow prebuilt) -> wait for approved status
       -> if verified: continue
  -> Amount + destination picker
       -> bank account (linked via Plaid in CoinflowWithdraw) — instant RTP / Same-Day ACH / Standard ACH
       -> debit card (push-to-card) — instant
  -> Confirm
  -> Coinflow processes -> webhook -> wallet.withdrawals row finalized -> balance reflects
```

Coinflow handles the heavy lifting — we render `<CoinflowWithdraw>` with a
session key, just like deposits. The web app's only direct API
responsibilities are: gating the UI on KYC status, creating the session
key, and recording the withdrawal intent so the user sees a pending row in
their activity list before settlement.

## API contract — what we need from `api-speed-survivor`

### 1. KYC status on `GET /api/v1/me`

Add a `kyc` block to the existing `MeResponse`:

```json
{
	"kyc": {
		"status": "unverified" | "pending" | "verified" | "rejected",
		"verified_at": "2026-05-11T12:00:00Z",
		"reject_reason": null
	}
}
```

The web app reads this on the wallet shell to show "Verify identity to
withdraw" until `status === "verified"`.

### 2. `POST /api/v1/wallet/withdrawals` — create a pending withdrawal

**Request:**

```json
{
	"subtotal_cents": 5000,
	"speed": "instant" | "same_day" | "standard",
	"destination_type": "bank" | "card"
}
```

**Response:**

```json
{
	"withdrawal_uuid": "...",
	"coinflow_session_key": "...",
	"account_uuid": "..."
}
```

Behavior:

- Verifies caller has sufficient balance (existing
  `WalletBalanceService.get_balance` minus current pending withdrawals).
- Inserts a row into `wallet.withdrawals` with `status = 'pending'`,
  `source = 'coinflow'`, and a fresh `external_id` UUID we'll forward to
  Coinflow as the idempotency key.
- Mints a Coinflow session key for the user (server-side, with the merchant
  API key). The web app embeds `<CoinflowWithdraw sessionKey={...} />`.

### 3. Webhook — extend `POST /webhooks/payments/settlement`

Currently the handler in `api/v1/hooks/router.py` only branches on
`category == "Purchase"`. Extend it to handle `category == "Withdraw"`:

- Look up the `wallet.withdrawals` row by `external_id = data.id`.
- On `eventType == "Settled"` -> mark `status = 'settled'`,
  `settled_at = now()`.
- On `eventType == "Failed"` / `Reversed` -> mark `status = 'failed'`,
  refund the amount (insert a compensating `wallet.deposits` row with
  `source = 'coinflow_refund'`, or use a dedicated `wallet.refunds`
  table — schema decision for the API team).

### 4. `wallet.withdrawals` schema additions

The current shape (used by `WalletBalanceService`) only stores
`user_uuid` and `amount`. Add:

- `source TEXT NOT NULL DEFAULT 'coinflow'`
- `external_id TEXT UNIQUE` (Coinflow purchase / payout id)
- `status TEXT NOT NULL DEFAULT 'pending'` (`pending | settled | failed | cancelled`)
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `settled_at TIMESTAMPTZ`
- `speed TEXT` (`instant | same_day | standard`)
- `destination_type TEXT` (`bank | card`)

The balance query stays correct as long as we sum only `status IN ('pending', 'settled')` — pending should hold the funds, failed should refund.

## Web app implementation (this repo)

Files to add when the API is ready:

- `app/wallet/withdraw/page.tsx` (already scaffolded — replace `WithdrawFlow`
  with the real flow).
- `app/api/coinflow/withdraw-session/route.ts` — proxies to
  `POST /api/v1/wallet/withdrawals` and returns `{ sessionKey,
  accountUuid }` to the client.
- `components/withdraw/CoinflowWithdrawEmbed.tsx` — wraps
  `<CoinflowWithdraw>` from `@coinflowlabs/react`, passing the session key
  + theme + `onSuccess` callback that invalidates wallet queries.
- KYC gating UI in `app/wallet/page.tsx` — show a banner if `me.kyc.status
  !== "verified"`.

The feature flag `NEXT_PUBLIC_FEATURE_WITHDRAWALS` already gates the
`/wallet/withdraw` page. Flip it to `true` once the API endpoints above
are live in sandbox.

## References

- Coinflow Payouts overview: https://docs.coinflow.cash/guides/payouts/implementation-methods/getting-started
- Coinflow KYC: https://docs.coinflow.cash/guides/payouts/kyc-verification/what-is-kyc
- `api-speed-survivor/modules/contest_registration/services/wallet_balance_service.py`
  — current balance calculation joins `wallet.deposits` minus
  `wallet.withdrawals`.
