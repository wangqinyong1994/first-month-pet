# Audit execution plan

1. Establish the repository and local baseline: current task, git state/revision, Node/npm versions, environment-key presence without values, dependency state, package metadata, routes, migrations, and linked deployment metadata.
2. Run the smallest complete automated proof: `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check`; capture failures exactly and avoid fixing them.
3. Use CodeGraph plus targeted source/SQL reads to trace authentication, authorization, profile/task synchronization, guidance gating, milestones, checkout return, webhook processing, and refund handling.
4. Compare application schema usage with migrations, seed assumptions, constraints, grants, and RLS definitions. Use remote read-only verification only if already configured and safe.
5. Start the local application and use ego-browser for non-mutating desktop and 390x844 checks of route reachability, responsive layout, semantics, loading/error behavior, service connectivity, and public/protected boundaries.
6. Resolve the currently linked production deployment without changing it. Inspect deploy/revision evidence, public HTTP status and headers, and the production site with ego-browser at desktop and 390x844; use authenticated pages only if an existing safe session is available.
7. Compare repository, local, and production configuration modes, route behavior, assets/content, Supabase schema evidence, and release state. Record drift only when both sides have current evidence.
8. Audit system concerns outside code: required configuration, external service dependencies, release path, health/logging signals, incident support, resilience, backup/recovery, and rollback evidence.
9. Deduplicate findings by root cause, assign P0-P3 severity, verify file/line or deployment/route anchors, and produce the final report with confirmed passes and blockers.

## Validation and stop conditions

- Never expose environment values; check only whether required names are present.
- Do not print ignored Netlify state or configuration files wholesale; extract only non-secret identifiers needed for read-only inspection.
- Stop any browser path before a form submission or external/payment mutation.
- A missing credential or authenticated session is a blocked check, not a defect.
- A static suspicion is a risk until reproduced or proven by deterministic flow.
- Do not edit product code during this task. Any remediation requires a separately approved task.
- Do not deploy, promote, roll back, change environment variables, apply migrations, or alter DNS during this task.

## Review gate before start

- PRD, design, and execution plan agree that the deliverable is a read-only report.
- No unresolved product or risk decision remains.
- Implementation and check manifests contain real project spec entries.
