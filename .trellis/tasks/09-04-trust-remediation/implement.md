# Implementation plan

1. Correct shared plan/home status derivation in `lib/app-data.ts` and, if needed, `lib/domain.ts`; add focused domain tests for elapsed nodes with unfinished tasks and Day 31+ overdue-task copy.
2. Update Home, Plan, Concern, Login, Profile, Paywall, and Checkout Return copy to use truthful user-facing language; confirm concern actions remain local progress records.
3. Add source-title/URL seed data only for the selected, species-appropriate public sources; render citations for free and paid users and leave an absent review date absent.
4. Add `/guidance`, `/refund`, `/contact`, and `/about` with the approved content; add a minimal public footer in `app/layout.tsx`. Do not add `/privacy` or `/terms`.
5. Add a support runbook with the application-data export and account-deletion operator procedure; it must include identity verification and exclude Creem-held records.
6. Run `npm test`, `npm run build`, `git diff --check`, and local browser checks for anonymous public routes plus authenticated Home, Plan, Concern, Profile, Paywall, and Checkout Return.

## Risk checks

- Verify each displayed source link and species mapping before seeding.
- Do not set `reviewed_at` without an actual content-owner review.
- Do not promise retention, deletion timing, tax treatment, merchant-of-record status, or legal jurisdiction.
- Preserve unrelated uncommitted changes.
