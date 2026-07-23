# AGENTS.md

## Cursor Cloud specific instructions

Next.js 15 wallet web app. Dependencies use **yarn**; standard scripts are in `package.json`
(`yarn dev` serves on **port 8081**, plus `yarn lint`, `yarn typecheck`, `yarn build`). Lint,
typecheck, and build all pass clean.

### Local config
Create a gitignored `.env.local` (copy `.env.local.example`) and point it at the local API so
auth and wallet reads hit the local backend instead of the hosted one:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:8081
```

Keep the `NEXT_PUBLIC_FIREBASE_*` values from the example (real public QA project
`speed-labs-198e6`).

### Auth flow (non-obvious)
- The login page is **sign-in only** — it expects the account to already exist in Firebase.
  There is no sign-up UI here (onboarding lives in the mobile app). To get a usable account,
  create the Firebase user another way first (e.g. via `api-speed-survivor` — see its
  `AGENTS.md` — or the mobile app), then sign in here with that email/password.
- On sign-in the browser talks to Firebase, then posts the ID token to the Next route
  `/api/auth/session`, which calls `${NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/login` server-side
  and stores the returned app JWT in an httpOnly cookie. So the local API must be running and
  in `ENVIRONMENT=development` (otherwise its HTTPS-enforcement middleware rejects the http
  call from Next).
- "Continue with Google" needs `localhost` added to Firebase authorized domains and a real
  Google account; email/password is the simpler local path.
