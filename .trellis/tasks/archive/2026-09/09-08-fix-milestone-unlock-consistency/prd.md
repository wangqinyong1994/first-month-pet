# Fix milestone unlock consistency

## Goal

Ensure every completed eligible task produces its corresponding milestone record, including tasks completed before a later page load or after a transient write failure, so Profile and Home reflect the real task state.

## Confirmed facts

- `updateTaskAction` writes `pet_tasks` and then calls `unlockMilestone`; the writes are not transactional (`app/actions.ts:188-239`).
- Derived milestones are evaluated only during a `done` task action (`app/actions.ts:442-487`), so already-completed tasks are not reconciled automatically.
- The current data showed completed vet, Week 2, Week 3, and Day 30 tasks without their milestone rows.
- `Records Checked` only has task definitions for `health_records_no` and `health_records_not_sure`; a profile with `health_records_status = yes` has no corresponding task (`supabase/migrations/002_seed.sql:27-36`).
- Milestone insertion is intended to be idempotent through unique `(pet_profile_id, milestone_id)` (`supabase/migrations/001_schema.sql:108-116`).

## Requirements

1. Reconcile milestone state from the current completed task set at a server-side boundary used by Profile/Home/Plan data loading or task synchronization.
2. Preserve idempotency and ownership: only the current user's pet profile may be reconciled, and existing milestone rows must not be duplicated or overwritten with unrelated triggers.
3. Add the missing `Records Checked` task path for profiles whose records status is `yes`, while retaining the existing `no` and `not_sure` variants.
4. Keep urgent-care guidance and existing free/paid visibility behavior unchanged.
5. Add focused automated coverage for direct task milestones, derived milestones, and the records-status variants.

## Acceptance Criteria

- [ ] A completed `plan_vet_visit` task produces `vet_visit_planned` if the row is missing.
- [ ] Completed Week 2/Week 3 tasks produce `routine_taking_shape` if the row is missing.
- [ ] A completed Day 30 / Week 4 task produces `first_month_complete` if the row is missing.
- [ ] A profile with `health_records_status = yes` receives a records-review task that can unlock `records_checked`; `no` and `not_sure` remain supported.
- [ ] Reconciliation is safe to run repeatedly and does not create duplicate milestones.
- [ ] Existing tests plus the new focused tests pass; lint and build remain clean where the environment permits.

## Out of scope

- Changing milestone names, copy, pricing, or paid visibility.
- Rewriting existing production milestone history beyond filling records justified by completed tasks.
- Replacing the current UI or adding a new milestone administration screen.

## Open questions

None. The implementation should use the existing task/milestone model and preserve the current product behavior.
