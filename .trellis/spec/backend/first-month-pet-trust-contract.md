# First Month Pet Trust Content Contract

## 1. Scope / Trigger

Use this contract when changing concern guidance metadata, public trust pages, or first-month plan status. These changes cross database seed data, server data loading, domain state, and server-rendered UI.

## 2. Signatures

- `planNodeUiState(node, tasks, currentDay)` returns `completed`, `overdue`, `elapsed`, `current`, or `upcoming`.
- `visibleConcernGuidance(guidance, paid)` returns only localized guidance fields; it hides paid rationale fields for free users.
- `concern_guidance.source_id` links to private `guidance_sources` provenance. Source records, publisher names, URLs, summaries, and review dates never enter public queries or rendered HTML.

## 3. Contracts

- A node is `completed` only when it has at least one visible task and every task is done. A past node with unfinished tasks is `overdue`; a past node with no tasks is `elapsed`.
- Localized concern copy must apply to the rendered species/concern pair and be original wording only. It must not claim veterinary review, diagnosis, treatment, dosage, or guaranteed accuracy.
- `/guidance`, `/refund`, `/contact`, and `/about` may contain only approved factual content. Do not add `/privacy` or `/terms` until the registered legal entity is known.
- Data export/deletion requests go to the published support channel, require identity verification, and exclude payment-provider records from any application-deletion promise.
- A completed active task with a milestone mapping must have a corresponding `pet_milestones` row; reads may reconcile missing rows idempotently using the `(pet_profile_id, milestone_id)` unique constraint.
- Derived milestones are computed from the full completed active task set, not only from the task submitted in the current request, so historical partial writes self-heal.
- Records-review task generation must cover all `health_records_status` values: `yes`, `no`, and `not_sure`.

## 4. Validation & Error Matrix

| Condition | Required behavior |
| --- | --- |
| Past node has an unfinished task | Render `overdue`, never `completed`. |
| Guidance has legacy provenance metadata | Keep it private; never render a citation or review-date text. |
| Free user opens concern guidance | Show vet/urgent-care thresholds; hide individualized rationale. |
| User requests deletion | Verify control of the account email before exporting or deleting application data. |
| Legal entity is unknown | Do not publish legal-identity, jurisdiction, retention, or Terms/Privacy claims. |
| Completed task has no milestone row | Reconcile from the authenticated pet profile's completed tasks; do not change task status. |
| Records status is `yes` | Generate the paid records-review task with `milestone_key = records_checked`. |

## 5. Good / Base / Bad Cases

- Good: cat vomiting guidance is selected only for cats and its private provenance is not rendered.
- Good: shared guidance is rendered directly without a source card or external link.
- Bad: setting `reviewed_at` to migration time, showing a cat-only claim to dog users, publishing diagnosis or treatment advice, or calling an overdue node completed because its date passed.
- Good: loading Profile after a partial task write repairs only missing milestone rows for that user's pet profile.
- Bad: trusting only the current task request to derive milestones, or leaving `health_records_status = yes` without a records task.

## 6. Tests Required

- Unit-test `planNodeUiState` with a past node containing unfinished and completed tasks.
- Unit-test free guidance visibility to ensure safety thresholds survive while paid rationale is removed.
- Build and request each public route; verify all public-footer links resolve.
- Before release, apply the source migration in the target database and check an authenticated cat and dog concern page.
- Unit-test direct task milestone mapping, Week 2/3 and Day 30 derived milestones, repeated reconciliation, and all three health-record statuses.

## 7. Wrong vs Correct

### Wrong

```ts
status: node.day_end < currentDay ? "completed" : "upcoming";
```

### Correct

```ts
status: planNodeUiState(node, nodeTasks, currentDay);
```

The correct form keeps task completion as the source of truth instead of turning elapsed time into a false completion claim.

### Wrong

```ts
await updateTask(task);
await unlockOnlyForCurrentTask(task);
```

### Correct

```ts
await updateTask(task);
await reconcileMilestonesForPet(userId, petProfileId);
```

The correct form repairs historical partial writes while the database uniqueness constraint makes repeated reads safe.
