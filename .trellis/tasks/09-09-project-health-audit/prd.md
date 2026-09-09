# Audit current project health

## Goal

Produce an evidence-backed, severity-ranked assessment of the current First Month Pet project across local development and production so the user can distinguish confirmed defects, environment drift, risks, blockers, and optional improvements.

## Background

- The repository is a Next.js 15, React 19, TypeScript application using Supabase Auth/Postgres and Creem checkout/webhooks.
- The checkout is linked to a Netlify site through ignored local state, while runtime configuration selects local/test or production Creem endpoints through environment variables.
- The current worktree was clean before this task was created; only this task directory is now untracked.
- CodeGraph is available and must be used before text search when tracing code behavior.
- Existing product boundaries require urgent-care and ask-a-vet guidance to remain available without purchase, server-side ownership checks for user data, and webhook-verified purchase state.

## Requirements

1. Audit the repository's existing checks: dependency state, tests, TypeScript, ESLint, production build, and diff hygiene.
2. Trace the actual runtime chains for authentication, profile/task synchronization, gated guidance, checkout creation/return, Creem webhook handling, and Supabase access boundaries.
3. Inspect migration ordering and compatibility against application queries. Remote Supabase state may be read for verification only when a configured read-only path is available; do not apply migrations or mutate data.
4. Inspect public and authenticated routes in the real local application with ego-browser when the required runtime and login state are available. Do not clear browser state or submit mutating forms, trigger checkout, sign out, or alter product data.
5. Check accessibility basics, responsive behavior, error/loading states, security boundaries, configuration completeness, operational readiness, and recovery/observability gaps in proportion to this MVP.
6. For every reported issue, provide severity, reproducible evidence, impact, affected file or route, and the smallest responsible-layer remediation direction.
7. Clearly separate confirmed defects, credible risks, environment-blocked checks, and non-blocking improvements. Do not claim a check passed unless it was run in this task.
8. Audit the local environment: runtime/tool versions, dependency installation, required environment-key presence, local build/start behavior, service connectivity, route behavior, and local data/schema compatibility.
9. Audit the production environment: deployed revision and configuration evidence available through the existing Netlify linkage, public route behavior, redirects/security headers, production Supabase/Creem mode alignment, service reachability, and release/rollback readiness.
10. Compare local, repository, and production evidence to identify configuration, schema, content, asset, routing, or release drift. Never expose secret values in the report.

## Acceptance Criteria

- [x] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check` are run and their exact outcomes recorded.
- [x] Authentication, authorization, business-state, payment/webhook, and database/migration flows are traced to their owning functions and trust boundaries.
- [x] All project routes are inventoried; representative public and protected pages are inspected locally at desktop and 390x844 when runtime access permits.
- [x] The linked production site is resolved from current deployment evidence and its public routes are checked at desktop and 390x844 without changing deployment/configuration state.
- [x] Local and production configuration names, deployment revision, schema/migration evidence, runtime behavior, and external-service modes are compared; every unverifiable difference is labeled as blocked rather than assumed.
- [ ] No production data, schema, payment, account, task, profile, or browser-login state is changed by the audit. Exception: authenticated page renders inserted `product_events` because current GET/render paths write analytics; no form, schema, payment, account, task, profile, deployment, configuration, or login-state mutation was performed.
- [x] Findings are deduplicated by root cause and ranked P0-P3, with file/line or route evidence and a minimal remediation recommendation.
- [x] The final report states what was not verified and why.

## Out of Scope

- Fixing discovered issues.
- Adding dependencies, features, abstractions, monitoring services, or test frameworks.
- Applying Supabase migrations or modifying remote/local application data.
- Deploying a build, changing Netlify settings/environment variables, promoting or rolling back a release, or modifying DNS.
- Triggering real or test purchases, refunds, webhooks, email links, or account lifecycle actions.
- Fabricating legal, support, retention, medical-review, or business-policy facts.

## Technical Notes

- Treat existing project memories as audit hints only; revalidate all current facts from the repository or runtime.
- Preserve the seven existing active Trellis tasks and all user work.
- If a check needs unavailable credentials or authenticated state, report the exact blocker instead of bypassing the boundary.
