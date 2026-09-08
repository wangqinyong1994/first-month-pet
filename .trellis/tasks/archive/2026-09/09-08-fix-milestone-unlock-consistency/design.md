# Technical design

## Ownership and flow

Keep milestone derivation in the existing server-side application data/action layer. Add one idempotent reconciliation helper that receives an authenticated user and pet profile, reads completed active tasks, and inserts only missing milestone rows through the existing privileged client after ownership has been established by the caller.

Call reconciliation from the existing task synchronization path and from the profile/home data boundary so historical completed tasks self-heal without requiring the user to toggle a task.

Direct task milestone mappings remain in `task_definitions.milestone_key`. Derived rules remain centralized in the reconciliation helper rather than duplicated in page components.

## Records task

Add a `health_records_yes` task definition for reviewing available records. It uses the same `records_checked` milestone key and should be active only when the profile status is `yes`. Existing `health_records_no` and `health_records_not_sure` definitions remain unchanged.

## Consistency and safety

- Use `upsert(..., { onConflict: "pet_profile_id,milestone_id", ignoreDuplicates: true })` through `unlockMilestone`.
- Do not alter completed task status while reconciling.
- Reconciliation must be bounded to the authenticated user's profile and active completed tasks.
- Existing task-action behavior remains intact; reconciliation supplements it for historical and partial-write cases.

## Verification

Unit tests should exercise the pure rule derivation or the smallest testable helper boundary. Existing `npm test`, `npm run lint`, and `npm run build` are the final checks. Database data repair for the already-affected account remains a separate explicit operation from this code change.
