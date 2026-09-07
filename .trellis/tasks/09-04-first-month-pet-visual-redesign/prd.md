# First Month Pet visual and interaction redesign

## Goal

Make First Month Pet feel like a warm, credible companion for first-time cat and dog adopters while preserving all current product behavior, safety boundaries, routes, and purchase rules.

## Confirmed facts

- The application is a Next.js 15 product using Server Components, Server Actions, Radix Themes, Supabase, and Creem.
- The existing interface is visually flat: login and public pages have excessive empty space, and product pages repeat the same bordered-card treatment.
- Existing actions already persist profile, task, concern, check-in, and purchase state. Profile updates already expose pending, success, and error state.
- The worktree contains unrelated, uncommitted user changes. They must be preserved.

## Requirements

- Preserve route paths, navigation labels, form names and ordering, Server Action signatures, payment wording, medical safety guidance, data access behavior, and analytics events.
- Replace the current visual language with a warm modern companion system: cool-white and mist surfaces, deep-ink typography, coral primary accent, semantic caution colors only for care guidance, and a consistent radius hierarchy.
- Add system light and dark themes, keyboard-visible focus, WCAG AA text and control contrast, 44px touch targets, and reduced-motion behavior.
- Use Geist through `next/font`, existing Radix Themes controls, semantic HTML, `next/image`, and native CSS. Do not add a UI, animation, state-management, or icon dependency.
- Generate new project-bound bitmap assets: one simplified brand mark, one login visual, and a consistent milestone illustration set. Do not leave referenced images outside the repository.
- Recompose Login, public pages, Home, Plan, Concern detail, Onboarding, Profile, Paywall, Checkout Return, the application shell, and Footer.
- Retain native plan disclosures and improve their hierarchy rather than replacing them with a client-heavy component.
- Add consistent pending, success, error, loading, and empty feedback for existing user actions without changing their persistence behavior.

## Acceptance Criteria

- [ ] Every affected route renders with the new token system in system light and dark modes with no mixed section theme.
- [ ] Login, public pages, Home, Plan, Concern, Onboarding, Profile, Paywall, and Checkout Return have distinct information hierarchy and no generic repeated-card layout.
- [ ] Existing unauthenticated, free, paid, post-month, task-complete, check-in, checkout-pending, empty, and error behaviors remain functionally equivalent.
- [ ] Action controls visibly communicate pending state and recoverable failure where the existing action can fail without redirecting.
- [ ] New visual assets are optimized `next/image` inputs inside `public/` and include appropriate alt behavior.
- [ ] Desktop and 390px mobile layouts have no horizontal overflow, no wrapped desktop navigation or CTA labels, and usable keyboard focus.
- [ ] `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check` pass.
- [ ] Browser checks use ego-browser for public and authenticated routes when a local session is available; lack of a session is reported rather than bypassed.

## Out of scope

- Changing product scope, information architecture, database schema, payment flow, AI diagnosis policy, route slugs, or current legal and safety text.
- New third-party frontend dependencies, an onboarding wizard, decorative scroll effects, or a manual theme toggle.
