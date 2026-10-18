# Smash Open — Badminton Tournament Registration

Next.js 14 (App Router) + Prisma + Postgres + NextAuth. "Liquid Glass" UI.

## Architecture

```
app/
  page.tsx                    Landing page (hero, countdown, category preview)
  tournament/page.tsx         Category breakdown
  register/page.tsx           Registration entry (server: checks session)
  register/RegisterForm.tsx   Multi-step client form (Zod + react-hook-form)
  dashboard/page.tsx          User dashboard — queries scoped to session.user.id
  login/, signup/page.tsx     Auth pages (Google OAuth + credentials)
  api/
    auth/[...nextauth]/       NextAuth handler
    signup/route.ts           Account creation (bcrypt hash, rate-limited)
    register/route.ts         Registration write (auth + rate limit + Zod + sanitize)
    registrations/route.ts    List own registrations
    registrations/[id]/       Get one registration (ownership-checked)
components/                   Glass UI primitives, Nav, Countdown
lib/
  auth.ts                     NextAuth config (Google + Credentials, JWT sessions)
  authz.ts                    Ownership checks — the RLS-equivalent app-layer guard
  validation.ts                Zod schemas shared client/server
  rate-limit.ts                In-memory + DB-backed limiters
  sanitize.ts                  DOMPurify wrapper for any free text
  prisma.ts                    Prisma client singleton
middleware.ts                 CSRF origin check + security headers (CSP, HSTS, etc.)
prisma/schema.prisma          Data model
prisma/rls.sql                Optional native Postgres RLS (defense-in-depth)
render.yaml                   Render Blueprint (web service + Postgres)
```

## Security checklist (what's implemented, and where)

| Requirement | Implementation |
|---|---|
| SQL injection | Prisma query builder everywhere — no raw string SQL. `$queryRawUnsafe` is never used. |
| XSS | React auto-escapes all output; `lib/sanitize.ts` strips any HTML from free-text fields before persisting; CSP header in `middleware.ts` as a second layer. |
| CSRF | NextAuth session cookie is `SameSite=Lax` + `httpOnly` + `Secure` in prod (`lib/auth.ts`); `middleware.ts` additionally rejects state-changing API requests whose `Origin` doesn't match the host. |
| Input validation | `lib/validation.ts` Zod schemas run client-side (react-hook-form) **and** re-validated server-side in every API route — client validation is UX only, never trusted. |
| AuthZ / per-user data isolation | `lib/authz.ts` scopes every registration read/write to `session.user.id` (or `ADMIN`). `prisma/rls.sql` provides the native-Postgres equivalent if you later split out a lower-privilege DB role. |
| Rate limiting | `lib/rate-limit.ts` — in-memory token buckets on login/signup/registration endpoints, plus a DB-backed lockout (10 failed logins / 15 min) that survives restarts. Swap to `RateLimiterRedis` (stubbed in the file) once you run >1 instance. |
| Password storage | bcrypt, cost factor 12, never logged or returned in API responses. |
| Security headers | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy — all in `middleware.ts`. |

## Local setup

```bash
cp .env.example .env   # fill in DATABASE_URL, NEXTAUTH_SECRET, Google OAuth creds
npm install
npx prisma migrate dev --name init
npm run dev
```

Generate `NEXTAUTH_SECRET`: `openssl rand -base64 32`

Google OAuth: create credentials at console.cloud.google.com → APIs & Services →
Credentials → OAuth client ID → Web application. Add
`http://localhost:3000/api/auth/callback/google` (dev) and
`https://YOUR-RENDER-URL/api/auth/callback/google` (prod) as authorized redirect URIs.

## Deploying to Render

**Option A — Blueprint (recommended, one shot):**

1. Push this project to a GitHub repo.
2. In Render: **New → Blueprint**, point it at the repo. Render reads `render.yaml`
   and provisions both the web service and the Postgres database automatically.
3. After the first deploy, open the web service → **Environment** and fill in the
   values marked `sync: false`:
   - `NEXTAUTH_URL` → your service's `https://<name>.onrender.com` URL
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
4. Add the Render URL's OAuth callback to your Google Cloud credentials (see above).
5. Trigger a manual redeploy so the new env vars take effect.

**Option B — Manual:**

1. **New → PostgreSQL** — create a database, note the Internal Connection String.
2. **New → Web Service** — connect your repo.
   - Build command: `npm install && npm run build`
   - Start command: `npm run start`
   - Add env vars: `DATABASE_URL` (the connection string from step 1), `NEXTAUTH_URL`,
     `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NODE_ENV=production`.
3. Render runs `npm run build`, which executes `prisma generate && prisma migrate deploy`
   before `next build` — migrations apply automatically on every deploy (see `package.json`).

### Post-deploy checklist
- [ ] Visit `/signup`, create a test account, confirm bcrypt hash is in the DB (not plaintext).
- [ ] Confirm Google sign-in redirects correctly (callback URL must match exactly, including `https`).
- [ ] Submit a test registration; confirm it appears only under that user's `/dashboard`.
- [ ] Try fetching another user's `/api/registrations/<id>` while signed in as someone else — should 404.
- [ ] Hit `/api/register` >5 times quickly — should 429 after the limit.

## Wiring a real payment gateway

The registration flow currently creates a `Payment` row with `status: PENDING` and
no provider call — see the placeholder block in `app/register/RegisterForm.tsx`
(step 3) and the `Payment` model in `prisma/schema.prisma`. To wire Razorpay:

1. Add `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` env vars.
2. In `app/api/register/route.ts`, after creating the registration, call
   Razorpay's Orders API to create an order for `feeAmount`, store `providerOrderId`.
3. Add `app/api/payment-webhook/route.ts` to receive Razorpay's webhook, verify its
   signature (HMAC with your key secret — reject anything that doesn't match), and
   update `Payment.status` → `SUCCEEDED` and `Registration.status` → `CONFIRMED`.
4. Replace the placeholder block in `RegisterForm.tsx` with Razorpay's Checkout.js,
   opened with the `providerOrderId` returned from step 2.
