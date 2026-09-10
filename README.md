# First Month Pet

English MVP for a one-pet, first-month onboarding plan using Next.js, Supabase Auth/Postgres, and Creem Checkout.

## Setup

1. Create a Supabase project and apply every migration in `supabase/migrations/` in filename order. Do not rename, replay, or edit a migration already recorded by a shared/production Supabase project; reconcile a mismatched remote ledger with Supabase's migration-history repair flow before applying new work.
2. Copy `.env.example` to `.env.local` and fill the values.
3. Configure Supabase email magic links to redirect to `/auth/callback`.
4. Set `CREEM_ENVIRONMENT=test` locally. The server then uses `https://test-api.creem.io` and only reads `CREEM_TEST_API_KEY`, `CREEM_TEST_WEBHOOK_SECRET`, and `CREEM_TEST_PRODUCT_ID`.
5. For production, set `CREEM_ENVIRONMENT=production`; it uses `https://api.creem.io` and the matching `CREEM_LIVE_*` variables.
6. Point the Creem webhook to `/api/creem/webhook` for:
   - `checkout.completed`
   - `refund.created`

## Commands

```bash
npm install
npm run dev
npm test
npm run build
```

## Boundaries

- Static paid content is stored in Supabase tables, but those tables have RLS enabled without client read policies. Server routes and server components return gated data.
- `purchases` is readable by the user and writable only through server-side service-role flows.
- Checkout Return never unlocks access from a URL parameter. It only reads local purchase state.
- A pet has at most one pending checkout. A retry reuses its stored provider checkout URL; provider creation failures are marked failed so the next attempt starts cleanly.

## Release checklist

1. Run `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check`.
2. Apply only the new additive migration after confirming the target project's migration history. Verify the pending-purchase index, `creem_checkout_url`, event-processing RPC grants, and a dedicated development record before production.
3. Deploy the verified commit, then confirm `/auth/callback?next=https://example.com` remains on the application origin, response security headers are present, and login/profile controls are at least 44px at 390px width.
4. Verify post-first-month Home, Plan, and concern pages are read-only. Do not trigger a real checkout, refund, email, or webhook just to verify a release.

Rollback is an application redeploy. The payment migration is additive and may remain in place; do not delete payment records to roll back.
