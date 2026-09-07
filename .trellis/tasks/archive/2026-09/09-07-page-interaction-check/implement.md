# Execution Plan

1. Build the route/control inventory from the current app source and existing actions.
2. Run the app locally and inspect all unauthenticated routes with ego-browser at desktop and 390px widths.
3. Reuse an available independent authenticated test session; verify allowed authenticated flows and record blocked flows when no session is available.
4. Validate link targets, forms, pending/error behavior, redirects, focusability, and layout overflow.
5. Write `checklist.md` and `report.md`, then run `git diff --check` and confirm no product source files changed.
