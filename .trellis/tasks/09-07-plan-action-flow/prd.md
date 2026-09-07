# Improve plan action flow

## Goal

Turn `/plan` from a primarily expandable timeline into a clear action page where an adopter can immediately understand first-month progress, find the next task, and read care and help guidance efficiently on desktop and mobile.

## Background

- The page already receives plan nodes and user tasks from `getPlanData()`; no new API, storage field, dependency, or database migration is needed.
- The current navigation always styles Home as selected and provides no `aria-current` state.
- `planNodeUiState()` currently combines elapsed/current timing with task completion, so `completed` and `elapsed` compete in one badge.
- Locked plan nodes currently remove `when_to_seek_help`; this conflicts with the product safety boundary that help thresholds stay visible without payment.
- `markTaskDoneAction` authenticates the user and scopes task reads and writes by `user_id`; the same boundary must apply to undo.
- Milestone feedback currently removes the entire query string after reading `milestone`, which would erase persisted node context.

## Requirements

### R1. Route-aware navigation

- Home, Plan, and Profile must derive their active state from the current pathname.
- Exactly one matching primary navigation link must use `aria-current="page"`.
- Remove the CSS rule that always highlights Home.

### R2. Progress summary

- During the first month, show the current plan stage plus completed and outstanding visible-task counts.
- After the first month with outstanding tasks, emphasize the remaining count and link to the next actionable node.
- After the first month with no outstanding tasks, show a completion summary and treat the timeline as optional review.
- Derive all progress from existing nodes and visible tasks.

### R3. Task-first node content

- In unlocked nodes with tasks, order content as tasks, care guidance, then `When to seek help`.
- Order unfinished tasks before completed tasks while preserving the existing order inside each group.
- Nodes without tasks keep a compact three-part care layout.
- `When to seek help` remains complete, prominent, and visible on locked nodes as well as unlocked nodes.
- Other paid node content remains hidden until purchase.

### R4. Separate time and task status

- Node time labels are `Today`, `Upcoming`, or `Ended`.
- Task labels independently communicate overdue count, completed fraction, or `No tasks`.
- A collapsed locked node explicitly displays `Locked`.
- Do not use one badge to represent both time passage and task completion.

### R5. Expansion and location

- Keep native `<details>` and allow multiple nodes to be open.
- Without an explicit URL node, default-open priority is: node with overdue work, current node, first node with unfinished work; if every visible task is complete, default all nodes closed.
- The summary communicates expanded/collapsed state accessibly without relying on the `+` glyph alone.
- Task completion and undo persist the owning node in the URL and return the user to that node after the server refresh.
- Existing `milestone` query behavior remains compatible and must not remove the node context.
- Mobile spacing is reduced without horizontal overflow or undersized controls.

### R6. Task completion and undo feedback

- Keep the existing pending state for `Mark done`.
- On success, show a clear task-local completion or undo confirmation and preserve the node position.
- Add `Undo`, which sets `status` to `not_done` and clears `done_at`.
- Both operations authenticate the current user, require an active task belonging to that user, and validate the supplied node context.
- A submission failure appears next to the task form and leaves the action available to retry; it must not use page-load failure wording.
- Existing milestone unlock behavior continues after completion. Undo does not revoke already unlocked milestones.

## Acceptance Criteria

- [ ] On `/home`, `/plan`, and `/profile`, only the matching primary link is visually current and has `aria-current="page"`.
- [ ] First-month, ended-with-open-work, and ended-complete summaries render the specified information from existing data.
- [ ] Each node shows an independent time label and task label; locked nodes show `Locked` before expansion.
- [ ] Unfinished tasks render before completed tasks, followed by care guidance and the full help guidance.
- [ ] Free users cannot see locked care content but can see the full `When to seek help` text.
- [ ] Default expansion follows overdue, current, unfinished priority, while an all-complete plan starts collapsed.
- [ ] Keyboard and pointer users can operate summaries, `Mark done`, and `Undo`; controls expose understandable accessible text.
- [ ] Completing or undoing a task returns to and opens its node, shows local success feedback, and preserves milestone feedback when newly unlocked.
- [ ] Failed task mutations show a task-local retryable error.
- [ ] Task completion and undo cannot update another user's or inactive task.
- [ ] At 1440px and 390x844, tasks are easy to discover, opened content stays readable, and no horizontal overflow appears.
- [ ] Focused domain tests, existing tests, lint, TypeScript, build, and `git diff --check` pass, or any environment blocker is reported precisely.

## Out of Scope

- New APIs, database columns, migrations, state-management libraries, accordion components, or payment changes.
- Revoking milestones or product events when a task is undone.
- Redesigning routes outside shared navigation and the task form compatibility required by the action signature.
- Reworking plan content or introducing external medical sources.
