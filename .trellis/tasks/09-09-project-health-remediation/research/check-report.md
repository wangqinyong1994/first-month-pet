# Independent remediation check

Date: 2026-09-09 (Asia/Shanghai)

## Verification

| Check | Result | Evidence |
|---|---|---|
| `npm test` | PASS | 24/24 tests passed. |
| `npx tsc --noEmit` | PASS | Exit code 0. |
| `npm run lint` | PASS | Exit code 0 after `.netlify/**` ignore and Hook dependency fix. |
| `npm run build` | PASS | Next 15.5.25 compiled, type/lint checks passed, 19 static pages generated. |
| `git diff --check` | PASS | Exit code 0. |

No remote migration, deployment, payment, webhook, email, or browser-state mutation was performed by this check.

## Confirmed fixed in the current diff

- `app/auth/callback/route.ts` rejects a missing/failed code exchange and redirects to a same-origin `/login?error=invalid_link`; `safeCallbackPath` remains the final same-origin target guard.
- `app/api/creem/webhook/route.ts` uses database claim/complete/release RPCs, checks event bookkeeping errors, restricts checkout completion to `pending`, and prevents `refunded -> paid` transitions.
- `lib/app-data.ts` returns `not_found` for an unknown checkout identifier, and the return page renders a non-pending state.
- The new migration adds the checkout URL, event processing lease, pending-per-pet uniqueness, server-role-only RPC grants, and server-side future-date validation.
- `.netlify/**` is excluded from ESLint; the milestone effect dependency is included.
- Login/profile controls inherit the existing 46px sizing rule, onboarding has `max=today` and an inline action error, and production site/Creem configuration fails closed when required values are absent.
- `next.config.mjs` supplies CSP, frame, referrer, permissions, and nosniff headers.
- README release guidance now distinguishes additive migration application from historical migration-ledger repair.

## Findings not fixed / blockers

### 1. Checkout provider calls are not serialized (high)

The follow-up implementation now uses `checkout_claim_token` and a ten-minute lease in `acquire_pending_purchase`; only the claimant may call Creem or persist the result. A concurrent caller receives an in-progress error, and a stale lease can be reclaimed. This is statically verified; no provider call was triggered.

The migration was applied after a read-only duplicate-pending preflight returned no rows. The provider itself was not invoked, so live Creem delivery behavior remains a blocked external check.

### 2. Unmatched refunds are retryable but not retained for reconciliation (medium/high)

The webhook now returns a failure and releases the event when no paid purchase matches `creem_order_id`, while the applied migration persists a server-only `order_reference` and `event_payload` for reconciliation. The provider itself was not invoked, so expiry-window behavior remains a blocked external check.

### 3. Migration preflight is still required (release blocker)

The read-only duplicate query against the authorized target returned no rows. The additive migration applied successfully as remote version `20260910003519`; its columns, functions, grants, and partial unique index were then verified. Historical migration files were not renamed or replayed.

### 4. Production verification remains blocked by credentials

The repository diff is locally verified, but Netlify deploy revision/build logs/env contexts and Creem webhook configuration are not proven in this check. The task can proceed to remote migration/deployment only after the user-controlled Supabase and Netlify authentication paths are available. After deployment, repeat the callback off-origin probe, headers check, and post-first-month read-only route checks. Do not trigger checkout/refund/webhook events as a smoke test.

## Scope notes

- `app/actions.ts` catches action failures and presents retryable UI, but checkout creation still relies on the provider/request ID behavior described above for concurrency safety.
- Webhook business-side updates are monotonic for the states covered by this route. An event whose business update succeeds but whose final event bookkeeping fails can be retried without duplicating `purchase_completed` or `refund_created` because the follow-up sees the terminal purchase state.
- The new `sync_pet_profile` definition preserves the existing authenticated grant because it uses `create or replace`; confirm the grant on the target database after migration.
- Local checks do not prove remote SQL syntax, function ownership, grants, migration history, Netlify configuration, or Creem delivery behavior. Those require controlled, read-only or explicitly authorized environment checks.

## Verdict

**Pass for local code quality and remote migration; production deployment remains pending.** The checkout lease and event reconciliation changes are statically verified, migration preflight was clean, and the additive migration is live. Netlify deployment revision/configuration and post-deploy route checks remain the next required step.
