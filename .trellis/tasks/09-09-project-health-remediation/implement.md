# Project health remediation implementation plan

1. Read the exact payment/auth/config callers and existing test seams; implement the additive Supabase migration and route/server contracts together.
   - Verify: migration SQL is forward-safe, server-only RPC grants are explicit, and no historical migration is changed.
2. Repair checkout creation/status and Creem webhook ownership/transition handling; add focused regression tests for duplicate/retry/refund paths.
   - Verify: tests demonstrate no duplicate effects and no `refunded -> paid` transition.
3. Repair callback, onboarding error handling, mobile controls, environment validation, headers, and lint configuration using existing patterns.
   - Verify: static tests plus 390px local rendered checks.
4. Update README release/migration instructions and record the production verification/rollback checklist.
   - Verify: instructions distinguish additive migration from historical-ledger repair.
5. Run `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check`; independently review the complete diff.
6. Apply migration using the configured Supabase path, verify schema/RLS/grants and only controlled test data behavior, then deploy through the existing Netlify linkage.
   - Stop condition: if Supabase or Netlify authentication is unavailable, pause for user-controlled login; never clear existing browser sessions or bypass credentials.
7. Verify the live deployment: callback cannot redirect externally, public/authenticated critical routes render, mobile touch targets meet 44px, and deploy revision is recorded.
   - Completed: Netlify deploy `6aa1fff2dd8a07831fcc581c` is ready; root/login/home/plan/concern/profile/paywall/checkout-return returned 200; external callback probe stayed on `/login?error=invalid_link`; required headers were present.

Risky files: `supabase/migrations/*`, `app/api/creem/webhook/route.ts`, `app/actions.ts`, `lib/app-data.ts`, `lib/env.ts`, `lib/creem.ts`, `next.config.mjs`.
