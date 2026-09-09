# Production and environment audit evidence

Audit date: 2026-09-09. All external checks were read-only except that authenticated page renders themselves insert `product_events` rows in the current application design.

## Confirmed findings

### P1 - Production is behind GitHub `main` and still exposes fixed first-month mutations

- Local HEAD and GitHub `main` both resolve to `bfd8323f77d8eeed2ba551bca50da00c5b75cafc` (merge timestamp 2026-09-09T00:35:40Z).
- Production `/home` for a profile whose first-month period ended still renders `Mark done` and `Today's check-in`. Production `/plan` still renders task action forms and says `Finish the remaining first-month actions at your own pace`. Production concern detail still renders `Change next step` and action buttons.
- Current repository source hides those controls after the first month: `app/home/page.tsx:45-47,106-121`, `app/plan/page.tsx:79`, and `app/concerns/[key]/page.tsx:38-57`. These changes were introduced by `8f71e04 fix: enforce first-month product invariants` and are present in GitHub `main`.
- Remote RLS and `record_concern_action` reject these writes after `adoption_date + 29`, so production advertises actions that cannot succeed. This is a deployed-version/release-chain defect, not a database drift defect.
- Smallest remediation direction: repair or run the production deploy from the current main revision, then verify the deployed commit and the three post-first-month pages.

### P1 - Production auth callback remains an open redirect

- Read-only request: `GET https://first-month-pet.netlify.app/auth/callback?next=https%3A%2F%2Fexample.com%2Fexternal-redirect-check` without an auth code returned `HTTP 307` and `Location: https://example.com/external-redirect-check?...`.
- Current source uses `safeCallbackPath` in `app/auth/callback/route.ts:1-15`; the production behavior matches the pre-`8f71e04` implementation that passed arbitrary `next` values to `new URL`.
- Impact: a trusted auth callback URL can send users to an attacker-controlled site, enabling phishing immediately after a sign-in flow.
- Smallest remediation direction: deploy current `main`, then repeat the header-only probe and require a same-origin `/home` redirect.

### P2 - Page-view tracking makes authenticated GET/render non-read-only and can inflate analytics

- `getHomeData()` inserts `home_viewed` at `lib/app-data.ts:245-250`; `getConcernDetail()` inserts `concern_opened` at `lib/app-data.ts:355-360`.
- `userState()` also calls `reconcileMilestones()` on every protected data load at `lib/app-data.ts:190-205`, which can insert derived milestone rows.
- During the login/audit window, aggregate read-only SQL observed two `home_viewed` rows at 05:25Z, two `home_viewed` plus one `concern_opened` at 05:28Z, and one `concern_opened` at 05:29Z. These align with login landing and repeated page inspection.
- Impact: refreshes, framework rendering, prefetching, monitoring, and QA can create application records and over-count actual user views. It also made the task's strict no-record-change acceptance criterion impossible once authenticated rendering began.
- Smallest remediation direction: move analytics to an explicit client-visible event or deduplicated ingestion boundary; keep milestone reconciliation separate from page reads or document it as an intentional idempotent repair.

### P2 - Repository migration filenames do not match the production migration ledger

- Remote Supabase reports 11 migrations, including `20260902062906 initial_pet_mvp_schema`, `20260902063012 seed_pet_mvp_content`, `20260902063057 harden_function_search_paths`, `20260902070351 migrate_stripe_to_creem`, `20260904013028 add_guidance_source_metadata`, `20260904013058 seed_guidance_sources`, `20260904033855 guidance_sources`, `20260904065407 localize_guidance_content`, and `20260908064253 atomic_profile_sync`.
- Repository filenames use `001_schema.sql`, `002_seed.sql`, `003_harden_function_search_paths.sql`, `004_migrate_stripe_to_creem.sql`, `20260903070000_add_guidance_source_metadata.sql`, `20260904090000_seed_guidance_sources.sql`, `20260904100000_guidance_sources.sql`, `20260904110000_localize_guidance_content.sql`, and `20260908050000_atomic_profile_sync.sql`.
- Only `20260903053617_remediation.sql` and `20260908031102_add_records_available_task.sql` match remote versions exactly.
- Impact: a standard migration comparison or push can treat already-applied changes as pending, making clean environment reproduction and rollback auditing unreliable.
- Smallest remediation direction: choose one authoritative migration history and reconcile filenames/ledger with forward-safe tooling before the next schema release; do not rewrite applied production history blindly.

### P2 - Mobile Radix login/profile controls are below the 44px target

- Production at a 390x844 viewport measured the login email input at 30px high and submit button at 32px. Authenticated Profile measured the Radix name input at 30px and `Save profile` at 32px.
- Current `app/globals.css:8-9` sets 46px for `.input`, `.select`, `.button`, and `.secondary`, but the default Radix `TextField.Root` and `Button` used at `app/login/page.tsx:42,46` do not receive those classes.
- Impact: primary authentication/profile controls have undersized touch targets even though native styled controls elsewhere meet 46px.
- Smallest remediation direction: apply the existing height invariant to the Radix base classes or pass the existing button class; no new component system is needed.

### P2 - Production lacks several browser security headers

- Public responses include HSTS (`max-age=31536000; includeSubDomains; preload`) and `X-Content-Type-Options: nosniff`.
- Sampled `/`, `/login`, `/about`, `/guidance`, `/refund`, `/contact`, `/home`, and API responses did not include Content-Security-Policy, Referrer-Policy, Permissions-Policy, or an explicit frame-embedding policy.
- Impact: weaker defense in depth for script/style injection, referrer leakage, unused browser capabilities, and clickjacking.
- Smallest remediation direction: add a minimal Netlify/Next.js header policy compatible with Supabase and Creem, validate it in report-only form if CSP compatibility is uncertain, then enforce.

### P3 - Production database has 15 unindexed foreign keys

- Supabase performance advisor reported 15 foreign keys without a covering index across concern actions/guidance, check-ins, concerns, milestones, tasks, product events, purchases, and task definitions.
- Current row counts are small, so this is not a present outage. Growth increases join, cascade-delete, and support-export cost.
- Smallest remediation direction: measure real queries first, then add only indexes that cover observed ownership lookups, cascade paths, and webhook order lookup.

## Verified passes

- Production public routes `/`, `/login`, `/about`, `/guidance`, `/refund`, and `/contact` returned 200 and rendered expected headings/content.
- Anonymous browser access to `/home`, `/plan`, `/profile`, `/onboarding`, `/checkout/return`, and a concern detail redirected to `/login`.
- Production authenticated Home, Plan, Profile, and concern detail rendered without horizontal overflow at 390px. Concern detail kept emergency, Ask a vet, and Seek urgent care guidance visible.
- Production images sampled on public pages loaded with non-empty alt text; decorative milestone images use empty alt text in source.
- Supabase project `first-month-pet` was `ACTIVE_HEALTHY` on Postgres 17.6.1.166. All public tables reported RLS enabled.
- Remote user-data policies scope reads/writes to `auth.uid()` and first-month write policies include the date cutoff. The two flagged SECURITY DEFINER functions revoke anonymous execution, validate `auth.uid()`, scope profile ownership, validate enums/concerns, and set an explicit search path.
- All four stored Creem events were processed with no recorded processing error at audit time. The database contained one paid and one pending purchase.
- All 14 concern-guidance rows had the three required guidance bodies. `guidance_sources` had no anon/authenticated table grants; its provenance remains private.
- Current Creem documentation confirms raw-body HMAC-SHA256 verification, duplicate delivery, five retry attempts, and the event payload fields used by the handler.

## Blocked or partial checks

- The machine has neither a global/local Netlify CLI nor `NETLIFY_AUTH_TOKEN`. Netlify's site API returned 401, so the published deploy ID, commit reference, deployment logs, build settings, and production environment-variable names/contexts were not directly verified.
- The production site URL was verified live, but its mapping to the ignored local Netlify site ID could not be authenticated through the API.
- Supabase Auth settings such as custom SMTP and leaked-password protection were not changed. The advisor reports leaked-password protection disabled, but this application currently uses magic-link authentication rather than passwords.
- Creem dashboard mode, registered webhook URL, webhook secret selection, and live product ID were not visible; no checkout or webhook was triggered.
- HTTP header checks used direct protocol requests. Browser semantic and visual checks used ego-browser with the user's existing production login.
