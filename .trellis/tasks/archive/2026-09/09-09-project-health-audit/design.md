# Project health audit design

## Evidence model

Use four explicit result classes:

1. **Confirmed defect**: reproduced by a command, runtime observation, or deterministic code path.
2. **Credible risk**: code or configuration evidence shows a failure mode, but the triggering external state is unavailable.
3. **Blocked check**: verification requires missing credentials, service access, data, or authenticated browser state.
4. **Improvement**: maintainability or operational hardening that does not represent broken current behavior.

Rank findings P0-P3 by user harm, security/data/payment exposure, and likelihood. Consolidate sibling symptoms under the owning root cause.

## Audit boundaries

- Static quality: package scripts, dependency metadata, TypeScript, lint, tests, build, TODO/suppression scans, and generated artifact hygiene.
- Application behavior: route inventory, Server Component and Server Action boundaries, redirects, validation, loading/error behavior, and accessible interaction semantics.
- Domain invariants: first-month state, task activation/completion, milestone uniqueness, species-specific guidance, and free safety guidance.
- Trust boundaries: Supabase user scoping/RLS assumptions, service-role usage, environment validation, checkout creation, return-page unlock behavior, webhook authentication/idempotency, and refund state.
- Data/release: migration ordering and application-schema compatibility, configuration/runbook completeness, service health, observability, resilience, and rollback/recovery evidence.
- Rendered product: ego-browser inspection of public and protected routes at desktop and mobile without submitting mutations.

## Environment comparison

Maintain a three-column evidence matrix for repository intent, local runtime, and production runtime. Compare:

- source revision and build result;
- required environment-variable names and selected service modes without reading secret values into the report;
- local and deployed route/status/header behavior;
- Supabase migration/schema evidence available through configured read-only access;
- static assets, redirects, authentication boundary, and paid-content boundary;
- deployment health, logs or diagnostics when already accessible, rollback evidence, and operator runbooks.

Production checks use the currently linked Netlify site and public URL discovered from live deployment metadata. A production observation is never inferred from a successful local build.

## Data flow tracing

Start with CodeGraph for symbol/caller paths, then use targeted `rg` and line-numbered reads for configuration, SQL, tests, and evidence not represented in the graph. Map each external input through validation, authorization, mutation, and rendered output. Compare database objects referenced by code with ordered migrations.

## Safety and compatibility

The audit is read-only except for Trellis task artifacts and normal local build caches. Do not alter environment files, browser login state, Supabase data/schema, Creem state, Netlify configuration/deployments, DNS, or application records. Browser checks must avoid checkout, save, completion, concern-action, sign-out, and callback flows that mutate state.

## Output contract

Lead with confirmed P0/P1 findings, then P2/P3 findings, environment drift, blocked checks, and verified passes. Each finding includes the affected environment, evidence, impact, owner, and the smallest remediation direction. If no issue is found in an area, report only the check performed—not a blanket guarantee.

## Rollback

No product-code rollback is expected. Remove only this task's generated local build artifacts if they interfere with later checks; preserve all existing repository and browser state.
