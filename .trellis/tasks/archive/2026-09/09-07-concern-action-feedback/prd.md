# Concern action saved-state feedback

## Goal

Make the concern action page clearly communicate the saved action so users do not repeat the same submission unless they want to change their decision.

## Requirements

- Read the current user's latest action for the current pet profile and concern.
- Show a status message with the saved action after the page reloads.
- Disable the already-selected action and label it as saved; keep the other actions available so the user can change the decision.
- Preserve the existing Server Action, milestone behavior, safety copy, and database schema.

## Acceptance Criteria

- [ ] A saved action is visible with an accessible status message.
- [ ] Repeating the same choice is prevented in the rendered UI.
- [ ] Alternative actions remain available for a changed decision.
- [ ] Existing concern guidance and action submission behavior remain intact.
- [ ] Tests, lint, TypeScript, build, and diff checks pass.

## Notes

- This is a focused UI/data-read change; no migration or action deduplication is introduced.
