# Remediate project health findings

## Goal

Correct the confirmed security, payment, release, and quality defects identified by the 2026-09-09 project-health audit, while preserving the first-month, ownership, and free urgent-care invariants.

## Confirmed background

- Production behavior omits current-main fixes for post-first-month controls and `safeCallbackPath`; the exact deployed SHA and deploy cause are unavailable.
- `app/api/creem/webhook/route.ts:37-50` cannot retry a duplicate event with `processed_at = null`; `checkout.completed` can restore `paid` after refund and both event bookkeeping writes ignore errors.
- `app/actions.ts:259-307` creates a fresh pending purchase on every checkout attempt and leaves an orphaned pending row if provider checkout creation fails.
- The local migration filenames and remote Supabase migration ledger differ. Any remote reconciliation must be forward-safe; applied production history must not be rewritten or replayed blindly.
- `npm run lint` scans `.netlify/**` and has one real Hook dependency warning. Build, type check, and 22 tests pass.
- Login/profile controls using Radix defaults violate the project's 44px touch-target minimum. `/auth/callback` currently hides magic-link exchange failure, and onboarding permits a future date that falls into the global error boundary.

## Requirements

1. Preserve same-origin auth callback behavior and ensure invalid/expired magic links reach a stable, actionable login error state.
2. Make Creem webhook duplicate retry handling safe under concurrency; preserve at-most-once business side effects and reliable failure bookkeeping.
3. Enforce monotonic purchase transitions so a refund cannot be overwritten by a later checkout event; retain/reconcile unmatched refund information instead of silently accepting it.
4. Make checkout creation idempotent for one pet, with an explicit outcome for provider-creation failure and unknown checkout-status identifiers.
5. Add the smallest forward-safe database migration(s) required for the above invariants and test them against the configured development database only after explicit approval for remote writes.
6. Restore deterministic local quality checks by excluding generated Netlify output and resolve the product Hook warning.
7. Apply existing 44px mobile control sizing to Radix login/profile controls; constrain onboarding date input and render inline validation failure.
8. Add fail-closed environment validation for production URL and Creem mode, plus minimal compatible browser security headers.
9. Update the README/release guidance to state the verified migration/deploy checks. Do not perform a major Next.js upgrade, bulk index work, or broad observability platform build in this task.

## Acceptance Criteria

- [x] A malicious external `next` value cannot redirect the deployed callback off-origin; invalid/reused auth codes show an actionable login state.
- [x] A duplicate unprocessed Creem event can be safely retried exactly once; duplicate completed events do not repeat purchase/refund side effects.
- [x] Refund and checkout events cannot transition a refunded purchase back to paid, and unmatched events are not silently marked successful.
- [x] Repeated/concurrent checkout creation for one pet reuses or rejects the existing active checkout; provider failure does not leave a misleading pending state; unknown checkout IDs are not shown as indefinitely pending.
- [x] Required migration(s) are additive, forward-safe, verified locally, and then applied under the user's 2026-09-09 authorization.
- [x] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check` pass.
- [x] Login/profile primary controls meet 44px at 390px width; future onboarding dates cannot reach the global error boundary.
- [x] Production configuration fails clearly when required site URL/Creem mode is absent, and response headers implement the approved minimum policy without breaking Supabase or Creem flows.
- [x] The verified build is deployed and remotely verified under the user's 2026-09-09 authorization; unavailable credentials pause the work for user-controlled login.

## Out of scope

- Major Next.js/PostCSS upgrade, broad database-index work, a full monitoring platform, backup restoration exercise, and historical migration-ledger rewrite.
- Triggering purchases, refunds, live webhooks, email delivery, account lifecycle changes, or altering browser login state during verification.

## Open decision

- Resolved 2026-09-09: the user authorized applying the verified migration(s) and deploying the verified fix to production after local checks pass. If the required Netlify/Supabase credentials are unavailable, pause for the user to complete login rather than bypassing the boundary.
