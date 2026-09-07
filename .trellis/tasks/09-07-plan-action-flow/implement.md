# Implementation Plan

1. Add deterministic domain derivation for node time state, task progress/default expansion, and completion/undo update values.
   - Verify with focused tests covering current, upcoming, ended, overdue, all-complete, no-task, and undo values.
2. Update plan data derivation and the paid-content boundary.
   - Verify aggregate counts, current stage, ordered tasks, and retained help text use existing fetched records only.
3. Add route-aware primary navigation and preserve non-milestone query parameters in milestone cleanup.
   - Verify pathname matching and `aria-current` in rendered output.
4. Refactor task completion into structured state plus a scoped undo action, then wire the shared native task form.
   - Verify active/current-user/node checks, pending labels, local retry errors, success redirects, and milestone compatibility.
5. Rework `/plan` summary, node header statuses, task-first ordering, default/URL expansion, anchors, and compact locked/free presentation.
   - Verify native details semantics and full help text visibility.
6. Add the smallest CSS changes for active navigation, status grouping, summaries, local feedback, task actions, and mobile density.
7. Run `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check`.
8. Use ego-browser against the local app for semantic and targeted 1440px/390x844 checks when authentication/runtime data are available; report any precise environment or auth blocker.

## Risk and Rollback Points

- `app/actions.ts`: preserve the current-user and active-task predicates; do not swallow redirects inside `try/catch`.
- `app/milestone-moment.tsx`: remove only the milestone parameter so node location survives.
- `lib/domain.ts`: changing the old combined node state requires updating every caller and existing tests together.
- `app/globals.css`: preserve unrelated visual redesign work; make selector-level edits only.
- The worktree already contains extensive user changes. Never reset, stage, or rewrite unrelated files.

## Review Gate Before Start

- PRD, design, and implementation plan agree on the free help boundary and undo semantics.
- No blocking product decision remains.
- Implementation/check manifests contain real project spec entries.
