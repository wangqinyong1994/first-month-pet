# Technical Design

## Boundaries

- `lib/domain.ts` owns deterministic plan time state, task progress summaries, default-node selection, and task mutation values so these rules are testable without Supabase.
- `lib/app-data.ts` continues to fetch the same records and returns presentation-ready node state plus aggregate progress; it does not change persistence.
- `app/actions.ts` owns authenticated task mutations and redirects. Completion and undo share one private mutation path while retaining separate exported server actions.
- A small client task form uses `useActionState` only to display local submission errors and reuses `PendingButton` for native form pending state.
- A small client primary navigation uses `usePathname` to set the current link. The root layout remains a Server Component.
- `app/plan/page.tsx` remains a Server Component and renders URL-selected/default-open native `<details>` nodes.

## Data and State Flow

1. `getPlanData()` fetches the profile, nodes, purchases, and active tasks through existing code.
2. Each node receives an independent time state (`today`, `upcoming`, `ended`), ordered tasks, and derived task progress. Aggregate counts and current stage are computed from the same visible-task set.
3. `/plan?node=<node-id>` overrides default expansion only when the ID belongs to a returned node. Otherwise the deterministic default selector applies.
4. A task form submits `task_id`, `return_to`, and `node_id` to the appropriate Server Action.
5. The action authenticates, loads an active task scoped by `user_id`, verifies its definition's node against `node_id`, and updates `status` plus `done_at`.
6. Mutation errors return a structured task-action state to `useActionState`. Success revalidates affected routes and redirects to the owning node with a success query and hash. Completion may also include `milestone`.
7. `MilestoneMoment` removes only `milestone` from the current query, preserving node and task feedback parameters.

## Contracts

- Task action state: idle or error with a user-facing retry message. Successful actions redirect and therefore do not return a success state.
- Completion update: `{ status: "done", done_at: <ISO timestamp> }`.
- Undo update: `{ status: "not_done", done_at: null }`.
- `return_to` remains allowlisted to `/plan` or `/home`; node context is accepted only for `/plan` and must match the task definition.
- URL task feedback identifies the updated task and operation; only the matching row renders the status message.

## Compatibility and Safety

- Home's existing completion form moves to the shared task form so the new action signature remains compatible; its redirect behavior remains `/home`.
- Milestones are unlocked only on completion. Undo deliberately leaves historical milestones intact.
- `visiblePlanNode()` continues hiding paid common signs and care actions but retains `when_to_seek_help` for the free safety boundary.
- No schema or RLS changes are required; user scoping remains explicit even though database policies also exist.

## Trade-offs

- Two tiny client components are preferable to converting the layout or plan page into client-rendered trees.
- URL state is used for durable node and success context; no accordion state store is introduced.
- Multiple `<details>` remain independent, so users can compare nodes and browser-native keyboard behavior is preserved.

## Rollback

- Changes are isolated to navigation rendering, plan derivation/rendering, task actions/forms, milestone query cleanup, focused CSS, and domain tests.
- Reverting these files restores the existing page without data migration. Task rows remain schema-compatible throughout.
