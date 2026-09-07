# Execution plan

1. Generate and inspect the replacement brand, login, and milestone images. Save approved assets in the repository.
2. Introduce global theme tokens, fonts, shell navigation, footer, shared buttons, form layouts, loading, and error styling.
3. Recompose public and authentication pages around the new brand visual and concise form hierarchy.
4. Recompose authenticated pages while preserving their current server data and action forms. Add small pending-control client leaves only where feedback is missing.
5. Run unit, lint, type, build, diff, and ego-browser desktop/mobile checks. Recheck all action and safety states after styling changes.

## Validation gates

- Preserve all existing hidden inputs, action values, links, and native form semantics.
- Audit light, dark, and reduced-motion rendering before the final check.
- Stop for user handoff if authenticated browser verification needs an unavailable local login session.
