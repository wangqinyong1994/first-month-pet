# Implementation plan

1. Inspect current task/milestone types and extract the smallest reusable reconciliation boundary.
2. Add the `health_records_yes` seed definition in every active seed/remediation source.
3. Implement idempotent reconciliation for direct and derived milestone rules and call it from task sync plus authenticated profile data loading.
4. Add focused tests for missing direct rows, Week 2/3 derived rows, Day 30 derived rows, and all three health-record statuses.
5. Run `npm test`, `npm run lint`, and `npm run build`; inspect the diff and preserve unrelated worktree changes.
6. If application verification passes, separately verify the affected Supabase data and report any required one-time repair SQL; do not silently mutate production data as part of the code change.
