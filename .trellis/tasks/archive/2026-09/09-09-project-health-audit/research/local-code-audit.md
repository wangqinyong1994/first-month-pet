# Local code and runtime audit

Audit date: 2026-09-09 (Asia/Shanghai)

Scope: repository, local runtime, configured Supabase project, authentication/domain/payment trust boundaries. This audit made no product-code, browser-state, database, payment, or environment changes.

## P0/P1 findings

### P1 confirmed defect — failed Creem events cannot be retried

- Environment: all deployments using `app/api/creem/webhook/route.ts`.
- Evidence: the handler inserts the event at `app/api/creem/webhook/route.ts:36-37`. On unique violation it loads the existing row and correctly identifies `processed_at = null` as retryable at lines 38-49, but the original `insertError` remains set and line 50 immediately throws it. The processing block at lines 52-107 is therefore unreachable for every retry of an event whose first attempt failed.
- Test gap: `tests/domain.test.ts:100-103` tests only `shouldProcessCreemEvent`; it does not exercise the route's control flow around the still-truthy insert error.
- Impact: a transient database/application failure can permanently prevent fulfillment of `checkout.completed` or `refund.created`. Creem retries non-200 webhook deliveries at increasing intervals, but this handler returns an error on every retry of the same event ID ([Creem webhook retry policy](https://docs.creem.io/skills/creem-api/WEBHOOKS)).
- Owner/remediation direction: make duplicate-event acquisition an atomic claim. A duplicate with `processed_at is null` must enter processing without rethrowing the handled unique violation, while concurrent processors must not both own the event. Add one route/database-level retry test.

### P1 credible billing risk — one pet can create multiple independent checkouts

- Environment: authenticated local and production runtimes.
- Evidence: `createCheckoutSessionAction` checks only whether any purchase is already paid (`app/actions.ts:273-274`), then inserts a new `pending` purchase on every invocation (`app/actions.ts:276-284`) and uses that new row ID as a distinct Creem `request_id` (`app/actions.ts:288-297`). `PendingButton` disables only the currently submitting form (`app/pending-button.tsx:11-13`), not retries, multiple tabs, or concurrent requests. The `purchases` schema (`supabase/migrations/001_schema.sql:119-133`) uniquely constrains only `creem_checkout_id`, not an active purchase per pet; the remote index inventory confirms the same.
- Impact: rapid retries or parallel tabs can create separately payable checkout sessions for the same one-pet entitlement, allowing duplicate charges.
- Owner/remediation direction: enforce idempotency at the server/database boundary by reusing a valid pending checkout or constraining/serializing active purchase creation per pet. Keep the browser pending state as UX only.

### P1 credible entitlement risk — webhook delivery order can restore access after refund

- Environment: all deployments using the Creem webhook.
- Evidence: `checkout.completed` updates a matching purchase to `paid` without an allowed-current-status predicate (`app/api/creem/webhook/route.ts:62-75`). `refund.created` can locate a purchase only by `creem_order_id` (`:86-95`); before the checkout event has populated that field, an out-of-order refund matches no row, yet the refund event is still marked processed (`:107`). A later checkout event then writes `paid`. A later distinct checkout-completed event can also overwrite `refunded` because no transition guard exists.
- Impact: refunded access can remain or become unlocked when signed webhook deliveries arrive out of order.
- Owner/remediation direction: model monotonic purchase-state transitions in one database operation; persist unmatched refund reconciliation data or resolve the purchase from the refund payload's checkout/request metadata before acknowledging it.

### P1 credible data-isolation risk — local development uses a populated hosted database with service-role access

- Environment: current local `.env.local`.
- Evidence: key-presence inspection (values suppressed) found all Supabase and both Creem test/live key names. `NEXT_PUBLIC_SUPABASE_URL` points to a hosted `*.supabase.co` project, not a local Supabase instance; read-only table inventory showed non-empty user-owned/application tables. Local `CREEM_ENVIRONMENT` is `test` and `NEXT_PUBLIC_SITE_URL` is `localhost:3000`, but server code uses `SUPABASE_SERVICE_ROLE_KEY` for reads and writes throughout `lib/app-data.ts` and checkout/webhook flows.
- Impact: normal authenticated local actions, page-view analytics, test checkout creation, or a mistaken mode change can mutate the shared hosted project. Local testing is not data-isolated.
- Owner/remediation direction: use a separate development Supabase project/branch (or local stack) and scope local credentials to it. Do not rely on `CREEM_ENVIRONMENT=test` as database isolation.

## P2 findings

### P2 confirmed release drift — repository migration versions do not match remote history

- Environment: repository versus configured Supabase project.
- Evidence: remote history contains 11 applied migrations and the deployed schema has all currently referenced tables/columns, but only `20260903053617_remediation` and `20260908031102_add_records_available_task` match local filename versions. Examples: local `001_schema.sql` versus remote `20260902062906_initial_pet_mvp_schema`; local `20260903070000_add_guidance_source_metadata.sql` versus remote `20260904013028`; local `20260908050000_atomic_profile_sync.sql` versus remote `20260908064253_atomic_profile_sync`. The repository has no `supabase/config.toml`, and the Supabase CLI is unavailable locally.
- Impact: a standard migration-history comparison cannot prove repository/remote parity and may treat already-applied, sometimes non-idempotent migrations as pending. Release and rollback procedures are not reproducible from this checkout.
- Owner/remediation direction: reconcile filenames/history using Supabase's supported migration-repair workflow, then add a documented read-only history check to release validation. Do not reapply migrations merely because the versions differ.

### P2 confirmed quality-gate failure — `npm run lint` scans generated Netlify output

- Environment: current checkout after existing Netlify artifacts are present.
- Evidence: `npm run lint` exited 1 after about 78 seconds with 5 errors and 29 warnings. Five errors came from generated `.netlify/**` files because `eslint.config.mjs:8-10` ignores only `.next/**` and `node_modules/**`. The same run reported one product-source warning at `app/milestone-moment.tsx:21`: missing `searchParams` in the effect dependency list.
- Impact: lint cannot serve as a reliable repository quality gate and spends most of its time auditing generated/vendor code.
- Owner/remediation direction: exclude `.netlify/**` in the ESLint config, then resolve or explicitly justify the product Hook dependency warning. Verify lint from a checkout containing generated Netlify output.

### P2 confirmed dependency advisory — production tree contains vulnerable PostCSS

- Environment: installed/locked production dependencies at audit time.
- Evidence: `npm audit --omit=dev` exited 1 with one high and one moderate advisory affecting `postcss@8.4.31`, pulled by `next@15.5.25` (`npm why postcss`). The reported issues include unescaped style output and source-map file disclosure/path traversal. npm's automatic recommendation requires the breaking move to Next 16, so no automatic fix was run.
- Impact: exposure depends on whether attacker-controlled CSS/source-map input reaches Next/PostCSS build paths; this audit did not establish such an input path, so this remains a dependency risk rather than a reproduced exploit.
- Owner/remediation direction: assess exploitability against the app's build/content pipeline and select a supported patched Next/PostCSS path; do not run `npm audit fix --force` without a framework-upgrade task.

### P2 confirmed UX defect — invalid/expired magic-link exchange is silently discarded

- Environment: `/auth/callback`.
- Evidence: `app/auth/callback/route.ts:10-15` awaits `exchangeCodeForSession(code)` but ignores its returned error and always redirects to the requested/default page. The protected destination then redirects the unauthenticated user to `/login`, without an error reason.
- Impact: expired, reused, or invalid magic links produce an unexplained redirect loop-like experience and no actionable retry message.
- Owner/remediation direction: branch on the exchange result and redirect to a stable login error state; preserve `safeCallbackPath` for open-redirect protection.

### P2 confirmed UX defect — onboarding permits a future date that ends in the global error boundary

- Environment: `/onboarding`.
- Evidence: the native date input has no `max` at `app/onboarding/page.tsx:36-39`. Server validation correctly rejects future dates in `app/actions.ts:362-365`, but `createProfileAction` (`:61-76`) has no form-state error path, so the expected validation failure escapes to `app/error.tsx` instead of returning an inline correction.
- Impact: a normal selectable value can replace the onboarding form with a generic page failure.
- Owner/remediation direction: add the native `max` as immediate guidance and return a structured server-action validation error for trust-boundary enforcement.

### P2 credible configuration risk — critical environment modes fail open to local/test defaults

- Environment: a misconfigured deployment.
- Evidence: `siteUrl()` falls back to `http://localhost:3000` (`lib/env.ts:7-9`), and Creem falls back to `test` when `CREEM_ENVIRONMENT` is absent (`lib/creem.ts:9-18`). These values construct magic-link and checkout return URLs (`app/actions.ts:47`, `:291`). Current local values are explicitly present and correct for local/test use.
- Impact: a production environment missing one variable can silently issue localhost auth/payment callbacks or select test-mode credentials instead of failing at startup/deploy validation.
- Owner/remediation direction: validate required environment names and allowed URL/mode combinations at server startup/build for the selected deployment environment.

## P3 / operational improvements

- **Repository hygiene (confirmed):** `.DS_Store`, `app/.DS_Store`, `public/.DS_Store`, and `supabase/.DS_Store` are tracked. The root instructions prohibit generating them, but `.gitignore` has no `.DS_Store` rule. Remove them in a separately approved cleanup and ignore the pattern.
- **Local npm configuration (confirmed):** every npm command warns `Unknown user config "home"`; it does not currently break checks but will stop being accepted in the next npm major. Fix the user-level npm configuration, not project code.
- **Security headers (credible risk pending production comparison):** `next.config.mjs:5-7` defines no response headers. Local `/about` returned `X-Powered-By: Next.js` and no CSP, frame-ancestor/X-Frame-Options, Referrer-Policy, Permissions-Policy, or nosniff header. A hosting layer may add them; production must be checked independently.
- **Observability/recovery (improvement):** no health endpoint, structured logger, error tracker, webhook alerting, deploy/rollback runbook, or database recovery test is present. `SUPPORT-RUNBOOK.md` covers only user export/deletion. For a payment-backed MVP, add the smallest operator-visible webhook failure signal and a tested release/rollback checklist before broader monitoring infrastructure.
- **Database performance (improvement):** the live Supabase performance advisor reports 15 unindexed foreign keys and two unused indexes. Current data volume is tiny, so do not add indexes wholesale; use query statistics before indexing the actual user/profile and cascade-delete paths.

## Environment and migration evidence

| Evidence | Repository intent | Current local runtime | Configured Supabase project |
|---|---|---|---|
| Source | `main` at `bfd8323f77d8eeed2ba551bca50da00c5b75cafc` | existing `next dev` at `127.0.0.1:3000` | schema inspected read-only |
| Payment mode | test locally, production in deploy | `CREEM_ENVIRONMENT=test` | payment API not invoked |
| Site URL | required in `.env.example` | `localhost:3000` | not applicable |
| Secrets | test/live names documented | all required names present; values not printed | no secret values read into report |
| Schema | 11 migration files | no local Supabase stack/CLI; app uses hosted project | 11 migrations registered; all 13 public tables have RLS |
| Seed/data shape | 10 plan nodes, 15 tasks, 14 guidance rows, 9 milestones | public landing loaded these remotely | counts match; 7 private sources and 9 mapped guidance rows |

Supabase security review details:

- All 13 public tables report RLS enabled.
- Anonymous REST probes returned zero rows for `care_plan_nodes`, `concern_guidance`, `purchases`, and `creem_events`; `guidance_sources` returned 401 after explicit grant revocation.
- Current RLS policies scope user-owned SELECT/INSERT/UPDATE access with `auth.uid()`. Purchases are client-readable only; milestones are client-readable only. Static/system tables intentionally have no client policies and are read through server service-role code.
- The security advisor warns that `sync_pet_profile` and `record_concern_action` are authenticated-callable `SECURITY DEFINER` functions. This is intentional in current architecture; both set `search_path`, require `auth.uid()`, and validate profile ownership. The remaining concern is that `sync_pet_profile` can be called directly and relies on table constraints for most inputs while its future-adoption-date rule exists only in `app/actions.ts`.
- The advisor's leaked-password warning is not material to the current magic-link-only login model.

## Automated and local runtime checks

| Check | Result |
|---|---|
| `npm test` | PASS — 22 tests, 0 failures |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | FAIL — 5 errors, 29 warnings; generated `.netlify` root cause plus one product Hook warning |
| `npm run build` | PASS — Next 15.5.25, 19 static pages generated, all routes compiled; repeated the Hook warning |
| `git diff --check` | PASS; the untracked report also passed `git diff --no-index --check` |
| `npm ls --depth=0` | PASS; two extraneous packages (`@emnapi/runtime`, `@img/sharp-wasm32`) were present |
| `npm audit --omit=dev` | FAIL — 1 high, 1 moderate PostCSS advisory |

Local HTTP/browser observations:

- Public `/`, `/about`, `/contact`, `/guidance`, `/refund`, and `/login` responded and rendered. `/api/checkout/status` without an ID returned 400; webhook GET returned 405.
- Next's development streaming response returns HTTP 200 plus a `NEXT_REDIRECT` marker for protected pages. This is not evidence of an auth bypass: ego-browser, with no local login state, navigated `/home` and ended at `/login`.
- ego-browser inspected `/` and `/about` at 1896x919 and 390x844. Both had headings/navigation, image alternative text, and no horizontal overflow at the sampled widths. The public landing retained urgent-care copy and exposed only locked-node titles for future paid nodes.
- The pre-existing port-3000 server briefly stopped responding while the production build and a second development-server probe shared `.next`; after stopping only the audit-owned second server, port 3000 recovered. The existing user/server process was not stopped or changed.

## Blocked or deliberately unexecuted checks

- Authenticated Home/Plan/Profile/Concern/Paywall behavior was not opened because the browser had no session and creating/login/submitting would mutate Auth/application state. These flows are covered only by static tracing and unit tests here.
- Magic-link delivery/custom SMTP was not triggered.
- Creem checkout, payment, webhook, refund, and API credential connectivity were not invoked; doing so would create external/payment state. Webhook conclusions above are deterministic code-path findings plus current official payload/retry documentation.
- The `SECURITY DEFINER` RPCs were not invoked because both write data. Their deployed definitions/grants and RLS policies were inspected read-only.
- A production-mode local `next start` run was not performed because an existing `next dev` process owns this checkout's shared `.next`; the isolated production build itself passed.
- Production deployment, production headers/routes, Netlify environment names, deployed revision, logs, and rollback state belong to the separate production audit and are not inferred from local success.
