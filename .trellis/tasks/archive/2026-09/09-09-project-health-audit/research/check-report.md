# Audit check report

Check date: 2026-09-09 (Asia/Shanghai)

Scope: independent review of the task requirements, local/code audit, production/environment audit, current repository source, and safe non-mutating command/protocol evidence. No authenticated page was revisited, and no product code, browser session, database, payment, or deployment state was changed by this check.

## Findings (fixed)

- File: `.trellis/tasks/09-09-project-health-audit/research/check-report.md`
- Issue: The two source audits contain sound evidence but need severity and claim-boundary corrections before consolidation.
- Fix: This report records the required corrections, acceptance exceptions, and report gate. Existing research files were intentionally left unchanged.

## Confirmed P1 findings

### Production auth callback open redirect

- Classification: P1 confirmed defect.
- Independent evidence: an anonymous, header-only GET to `https://first-month-pet.netlify.app/auth/callback?next=https%3A%2F%2Fexample.com%2Fexternal-redirect-check` returned `307` with a cross-origin `Location` to `https://example.com/...` during this check.
- Repository comparison: current `app/auth/callback/route.ts:8-15` applies `safeCallbackPath`; commit `8f71e04` includes that callback change.
- Required wording: production is confirmed to be running behavior that omits the current fix. The exact deployed commit is blocked because authenticated Netlify deployment metadata is unavailable.

### Failed Creem events cannot be retried

- Classification: P1 confirmed defect.
- Independent evidence: `app/api/creem/webhook/route.ts:37-50` retains the original unique-violation `insertError`. A duplicate row with `processed_at = null` passes `shouldProcessCreemEvent` but immediately throws at line 50, before the processing block.
- Impact: a transient first-attempt failure leaves the event permanently unprocessable by delivery retries with the same event ID.
- Test evidence: `tests/domain.test.ts` covers only the helper predicate; it does not execute the route acquisition/control flow.
- Required remediation wording: clearing the handled error alone is insufficient under concurrency. The responsible fix must atomically claim an unprocessed event, preserve at-most-once side effects, and include a route/database-level retry regression check.

## Severity and evidence corrections required

1. **Production release drift remains confirmed, but its cause must be scoped.** The authenticated runtime observations and the open-redirect reproduction prove that production omits behavior present in current `main`. They do not prove the exact deployed SHA or that the cause is specifically a failed Netlify deploy. Use “production artifact does not contain current-main fixes”; list deploy ID/SHA/build logs as blocked.
2. **Local hosted Supabase exposure should be P2 credible operational risk, not P1, unless production-project identity is proved.** Current evidence proves that local development has service-role access to a populated hosted Supabase project. Netlify environment access is blocked, so the audits cannot prove that this is the production database. The isolation recommendation remains valid.
3. **Missing security headers are P2 defense-in-depth improvement/risk, not a reproduced exploit.** Missing CSP, Referrer-Policy, Permissions-Policy, and frame policy are confirmed response facts; injection, referrer disclosure, or clickjacking was not reproduced.
4. **PostCSS advisory is P2 credible dependency risk.** `next@15.5.25` currently resolves `postcss@8.4.31`, but no attacker-controlled CSS/source-map path was established. Keep exploitability explicitly unverified.
5. **Duplicate checkout and refund-order findings may remain P1 credible billing/entitlement risks.** The source deterministically allows a new pending purchase and distinct provider request ID on each attempt, and permits `refunded -> paid`; actual duplicate charging or out-of-order provider delivery was not triggered. They must not be labeled reproduced incidents.
6. **Migration history drift is P2 confirmed release risk.** Local migration filenames and the recorded remote ledger differ. The current deployed schema being compatible does not make a future migration push safe; do not claim a migration failure was reproduced.
7. **Mobile control sizing is P2 confirmed accessibility defect.** The 30px/32px measurements violate the project frontend specification's 44px minimum and also remain possible in current source because the existing height classes are not applied to the Radix controls.
8. **The Creem documentation link in the consolidated report should use the canonical webhook page** (`https://docs.creem.io/code/webhooks`) rather than the audit's `/skills/creem-api/WEBHOOKS` path.

## Additional evidence-backed gaps to consolidate

- `app/api/creem/webhook/route.ts:107` ignores an error while marking an event processed; lines 109-112 also ignore an error while recording `processing_error`. This is a P2 credible reliability/observability risk and belongs under the webhook root cause, not as a separate platform finding.
- Checkout-completed and refund handlers acknowledge and mark an event processed when the constrained purchase update returns no row. This is a P2 credible reconciliation gap; no live missed fulfillment was demonstrated.
- `createCheckoutSessionAction` inserts a pending purchase before calling Creem and has no compensation path if checkout creation fails. A pending row in the remote snapshot does not prove that this path caused it. Report as P2 credible orphan-state risk only.
- `checkoutStatus()` maps an absent purchase to `pending`, so an authenticated unknown checkout ID can display “processing” indefinitely. This is a P2 confirmed status-model defect; it does not grant entitlement.
- The four processed Creem events in the remote snapshot are a point-in-time observation only. They do not mitigate or disprove the deterministic webhook retry defect.

## Acceptance-criteria exceptions and artifact gaps

- **Not met:** “No production data ... is changed by the audit.” Authenticated Home and concern renders inserted `product_events`; the production audit records the observed rows. This must be disclosed as an acceptance exception, not checked as passed. Milestone reconciliation also makes protected GETs potentially mutating, although no new milestone insertion was proved during the audit.
- **Partially met in the current artifacts:** `local-code-audit.md` says authenticated local routes were blocked, but the user subsequently logged in and the main audit inspected local Home, Plan, Profile, and concern pages. The consolidated report must capture that later evidence and explicitly supersede the stale blocked statement.
- **Partially documented:** the source audits collectively address all 16 page/route files, but they do not present one explicit route inventory and viewport matrix. The consolidated report should list the 14 pages plus two route handlers, and state exactly which local/production routes were checked at desktop and 390x844.
- **Blocked, correctly:** exact Netlify deploy SHA/ID, build logs, environment contexts, rollback evidence, production Creem dashboard mode/webhook registration, and SMTP delivery were not available and must remain blocked.
- **Executed, but failed:** the lint acceptance item is satisfied as an executed check, not as a passing quality gate.

## Findings (not fixed)

- Product and infrastructure defects were not changed because the approved task is a read-only audit and remediation is explicitly out of scope.
- Netlify deployment metadata and production environment settings could not be independently checked without credentials.
- Remote Supabase ledger/advisor observations were reviewed from the recorded read-only evidence; this check did not issue new remote queries.

## Verification

- Lint: fail — independently reproduced `5 errors, 29 warnings`; all 5 errors originate under generated `.netlify/**`, plus one product warning at `app/milestone-moment.tsx:21` and the config-file warning.
- TypeCheck: pass — `npx tsc --noEmit` exited 0 during this check.
- Tests: pass — `npm test` passed 22/22 during this check.
- Build: pass in the source audit — `npm run build` completed with 19 static pages and the existing Hook warning; not rerun here to avoid disturbing the active checkout's shared `.next` runtime.
- Diff hygiene: pass — `git diff --check` exited 0 during this check; only the task directory is untracked.
- Security probe: fail — production callback cross-origin redirect independently reproduced.

## Report gate

The consolidated audit report may proceed after applying the wording/severity corrections above and explicitly marking the production-record mutation acceptance exception. No product remediation should be mixed into this audit task.
