# Technical Design

## Evidence flow

1. Read route and action definitions to derive the control inventory.
2. Start the existing Next.js app without changing tracked source files.
3. Use ego-browser semantic snapshots first, then keyboard/viewport checks and screenshots only where needed.
4. Record each result in `checklist.md`; record failures and blockers in `report.md`.

## Safety boundaries

- Use a dedicated local/test session only.
- Do not perform real checkout completion, refunds, account deletion, or production writes.
- Never clear browser cookies or login state.

## Result model

Each check records: route, state, control/action, expected result, actual result, status (`PASS`, `FAIL`, `BLOCKED`), severity for failures, and evidence.
