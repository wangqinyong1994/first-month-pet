# First Month Pet project health audit

Audit date: 2026-09-09 (Asia/Shanghai)

## Executive result

No P0 outage was reproduced. The audit found four P1-level root causes: the production artifact omits current-main fixes for post-first-month mutations and auth callback redirects; Creem webhook retries cannot recover after a first failure; checkout creation has no server/database idempotency; and payment events can restore entitlement after a refund when delivered out of order. Local development also uses a populated hosted Supabase project with a service-role key, so it is not isolated from that hosted data; access to Netlify environment settings was blocked, so this audit does not claim it is the production database.

No product code, deployment, configuration, schema, payment, or browser login state was changed. Authenticated page inspection did create page-view analytics rows because the application performs writes during GET/render; this is itself a finding and the only acceptance-criterion exception.

## Priority findings

| Priority | Status | Root cause and evidence | Impact | Smallest responsible remediation |
|---|---|---|---|---|
| P1 | Confirmed production defect | Production behavior omits fixes present in GitHub/local `main` (`bfd8323f77d8eeed2ba551bca50da00c5b75cafc`). Its post-first-month Home, Plan, and concern pages still render mutation controls that current source removed in `app/home/page.tsx`, `app/plan/page.tsx`, and `app/concerns/[key]/page.tsx`. The exact deployed SHA and failure cause are blocked. | Users are offered actions that remote policy rejects; production behavior disagrees with the current domain invariant. | Publish a production artifact from current `main`, then verify the deployed revision and all three routes. |
| P1 | Confirmed security defect | A header-only request to production `/auth/callback?next=https://example.com/...` returned `307` to the external origin. Current `app/auth/callback/route.ts` already uses `safeCallbackPath`, so this is also deployment drift. | A trusted auth callback URL can be used for phishing after sign-in. | Deploy current `main`; repeat the probe and require a same-origin `/home` redirect. |
| P1 | Confirmed payment defect | In `app/api/creem/webhook/route.ts:38-50`, duplicate handling recognizes an unprocessed event as retryable, but the handled `23505` error remains set and is immediately thrown. Existing tests cover only the helper, not route control flow. | A transient first-attempt failure permanently blocks fulfillment or refund handling despite Creem retries. | Atomically claim/reclaim one event and add one route-level retry regression test. |
| P1 | Credible billing risk | `createCheckoutSessionAction` creates a fresh pending purchase and request ID on every call; neither the schema nor server serializes one active checkout per pet. Browser pending state covers only one form submission. | Retries or parallel tabs can create multiple separately payable sessions for one entitlement. | Reuse a valid pending checkout or enforce/serialize one active purchase per pet at the database boundary. |
| P1 | Credible entitlement risk | `checkout.completed` can overwrite any current state with `paid`; an early `refund.created` can match no `creem_order_id` yet still be marked processed. | Out-of-order signed events can leave refunded access active. | Make purchase transitions monotonic and persist/reconcile unmatched refunds before acknowledging them. |

## P2 findings

- **Migration/release history drift:** nine of eleven repository migration versions differ from the live Supabase ledger, although the currently referenced schema objects exist. A normal history comparison cannot prove parity and may propose reapplying old changes. Reconcile with Supabase's supported migration-history repair flow before the next schema release; do not rename or replay production migrations blindly.
- **Local data is not isolated:** local `.env.local` points to a populated hosted Supabase project and server paths use `SUPABASE_SERVICE_ROLE_KEY`; only Creem is in test mode. Normal local page loads or actions can mutate that hosted data. Use a separate development project/branch or local stack. Production-project identity was not proven, so this is P2 rather than a production-data claim.
- **Lint is not a usable quality gate:** `npm run lint` fails with 5 errors and 29 warnings because flat ESLint config scans generated `.netlify/**`; one real source warning remains at `app/milestone-moment.tsx:21` for a missing effect dependency. Ignore `.netlify/**`, then resolve or document that single source warning.
- **Production dependency advisory:** `npm audit --omit=dev` reports one high and one moderate PostCSS advisory through `next@15.5.25`. Exploitability through this application's build/content inputs was not established, and the automatic fix requires a breaking Next 16 upgrade. Handle in a focused framework/dependency task rather than `npm audit fix --force`.
- **Authenticated GETs write data:** `getHomeData()` and `getConcernDetail()` insert analytics events, and `userState()` may reconcile milestones. The audit observed corresponding `home_viewed` and `concern_opened` rows. Rendering, refresh, prefetch, monitoring, and QA can inflate analytics or create derived rows. Move analytics to an explicit/deduplicated event boundary and separate milestone repair from reads.
- **Magic-link failure is silent:** `/auth/callback` ignores `exchangeCodeForSession` errors and redirects onward, after which the protected route returns the user to login without a reason. Redirect invalid/expired links to a stable login error state.
- **Onboarding future date reaches the global error boundary:** the native date input has no `max`; server validation rejects the value, but the action has no inline error path. Add the native bound for guidance while retaining server validation and returning a structured form error.
- **Environment defaults fail open:** missing production site URL falls back to localhost, and missing Creem mode falls back to test. Validate required production environment names and URL/mode combinations at build/startup.
- **Mobile primary controls are undersized:** at 390x844, production login/profile Radix inputs measured 30px and primary buttons 32px, while the project's existing control invariant is 46px. Apply the existing height style to those Radix controls.
- **Browser hardening is partial:** production has HSTS and `X-Content-Type-Options`, but sampled HTML/API responses lacked CSP, Referrer-Policy, Permissions-Policy, and an explicit frame policy. Add the smallest compatible Next/Netlify header set and test CSP compatibility before enforcing it.
- **Webhook completion errors can be lost:** the final `creem_events` processed/error updates do not inspect their returned errors, and a checkout event that updates no purchase is still acknowledged as processed. Require a matched purchase and check bookkeeping update results before returning 200.
- **Checkout failure leaves pending rows:** a pending purchase is inserted before the external checkout call; external failure leaves an orphan. Also, an unknown checkout ID is reported as pending forever. Mark failed creation attempts explicitly and distinguish unknown from pending in status responses.

## P3 and operational gaps

- The live Supabase advisor reports 15 foreign keys without covering indexes. Current data is small; index only observed ownership, order lookup, export, and cascade paths after measuring queries.
- Tracked `.DS_Store` files and the absence of a `.DS_Store` ignore rule conflict with repository hygiene instructions. Remove them only in a separately approved cleanup.
- Local npm emits `Unknown user config "home"`; fix the user-level npm setting, not project code.
- There is no health endpoint, structured error reporting, webhook failure alert, deployment/rollback runbook, or verified database recovery exercise. The first useful addition is an operator-visible webhook failure signal plus a tested release/rollback checklist.
- The repository README's migration instructions cover only the first two SQL files and do not describe the actual eleven-migration lifecycle.

## Environment comparison

| Area | Repository intent | Local runtime | Production/live evidence |
|---|---|---|---|
| Source | `main`/HEAD `bfd8323f77d8eeed2ba551bca50da00c5b75cafc` | build and authenticated post-month behavior match current source | rendered behavior and open redirect match an older revision; exact deploy commit blocked |
| App | Next.js 15.5.25, React 19 | existing `next dev` at `127.0.0.1:3000`; public/protected/authenticated routes inspected | `https://first-month-pet.netlify.app` reachable; public and authenticated representative routes inspected |
| Supabase | 11 migration files; service-role server reads/writes; RLS for client access | points to hosted project, not isolated | project healthy on Postgres 17.6; 11 migrations registered; all 13 public tables have RLS |
| Creem | test/live keys selected by environment; signed webhooks own entitlement | configured for test; no checkout invoked | dashboard mode, endpoint registration, secret, and live product alignment blocked |
| Release | ignored local Netlify linkage; no committed deployment/runbook config | Netlify CLI/token unavailable | public site verified, but deploy ID, commit, logs, build settings, env contexts, and rollback evidence blocked |

## Verification performed

| Check | Result |
|---|---|
| `npm test` | PASS — 22/22 |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS — 19 static pages generated; one Hook warning repeated |
| `npm run lint` | FAIL — 5 errors, 29 warnings; generated `.netlify` is the error source, plus one product Hook warning |
| `git diff --check` | PASS |
| `npm ls --depth=0` | PASS; two extraneous packages reported |
| `npm audit --omit=dev` | FAIL — 1 high and 1 moderate PostCSS advisory |

Rendered checks covered public `/`, `/login`, `/about`, `/guidance`, `/refund`, and `/contact`; anonymous protected-route redirects; and authenticated Home, Plan, Profile, and concern detail locally and in production. Sampled public and authenticated mobile pages had no horizontal overflow. Production concern guidance preserved emergency, Ask a vet, and urgent-care content. No form, checkout, sign-out, refund, webhook, migration, or database mutation command was invoked.

The explicit route inventory is 13 page routes—`/`, `/about`, `/checkout/return`, `/concerns/[key]`, `/contact`, `/guidance`, `/home`, `/login`, `/onboarding`, `/paywall`, `/plan`, `/profile`, and `/refund`—plus three handlers: `/auth/callback`, `/api/checkout/status`, and `/api/creem/webhook`. Local public `/` and `/about` were checked at desktop and 390x844; local authenticated Home, Plan, Profile, and concern detail were checked at 390x844 after the user logged in. Production public/auth boundaries and representative public pages were checked through HTTP/browser evidence; authenticated Home, Plan, Profile, and concern detail were checked at 390x844. Unlisted route/viewport combinations were inventoried or status-checked, not claimed as visual passes.

Remote database checks confirmed all public tables have RLS, user policies scope to `auth.uid()`, static provenance has no anon/auth grants, and the two advisor-flagged `SECURITY DEFINER` functions set search paths and validate identity/ownership. Four stored Creem events were processed without recorded errors at inspection time; this does not exercise the failed-retry path.

## Blocked checks

- Exact production Netlify deploy ID/revision, logs, build settings, environment-variable names/contexts, promotion history, and rollback state: no Netlify CLI or authenticated API token was available.
- Creem dashboard environment, registered webhook URL, secret selection, live product ID, delivery history, and refund behavior: no external state was triggered or changed.
- Magic-link delivery/custom SMTP and account lifecycle: deliberately not triggered.
- Backup restoration/recovery: no documented safe test target or runbook exists.

## Recommended order

1. Restore production to current `main` and verify the open redirect plus post-first-month controls are gone.
2. Fix webhook retry ownership and monotonic payment-state transitions with focused regression tests.
3. Add checkout idempotency and isolate local Supabase data.
4. Reconcile migration history and make lint deterministic.
5. Address magic-link/onboarding error UX, environment validation, mobile targets, and security headers.

Detailed evidence: `research/local-code-audit.md` and `research/production-environment-audit.md`.
