# First Month Pet UI and Trust Redesign Plan

## Goal

Upgrade the current MVP into a credible, calm pet-care product for new cat and dog adopters in Europe and North America. Preserve the current Next.js, Supabase, Creem, Server Actions, routes, and domain rules.

## Constraints

- Use `@radix-ui/themes` as the only UI component library.
- Keep native form semantics, `name` fields, browser validation, and Server Actions.
- Do not add Tailwind, shadcn/ui, MUI, Ant Design, AI diagnosis, telehealth, or location-based emergency search.
- Do not publish unverified veterinary, legal, privacy, pricing, testimonial, or certification claims.
- Keep urgent-care guidance free of the paywall.

## Phase 1: UI Foundation

1. Install `@radix-ui/themes` and import its stylesheet in the root layout.
2. Wrap the application in one `Theme` provider and configure the global gray scale, radius, and sizing.
3. Replace custom control markup with Radix Themes components where semantics remain equivalent:
   - Button, TextField, Select, Checkbox, Card, Badge, Callout.
4. Keep CSS responsible only for brand tokens, page layouts, responsive rules, and pet-care status treatments.
5. Establish the Calm Pet Care visual system:
   - Warm-white canvas, white surfaces, charcoal text, subtle borders.
   - Charcoal primary actions.
   - Sage only for complete or stable state.
   - Muted yellow only for veterinary-contact guidance.
   - No gradients, glass, heavy shadows, cartoon styling, fake real-time states, or generic icon sets.
6. Add consistent hover, active, disabled, error, focus-visible, and reduced-motion behavior.

## Phase 2: Primary Product Flows

### Home

1. Keep the primary sequence as: current phase, today's action, highest-priority concern, remaining concerns, current plan, check-in, milestone.
2. On mobile, render today's action before concern lists.
3. Render exactly one expanded priority concern and compact links for other concerns.
4. Replace day counts greater than 30 with the `First month complete` state.

### Plan

1. Keep native `<details>` for plan disclosure.
2. Open the current node by default; keep completed and future nodes collapsed.
3. Show only status, title, and date in collapsed summaries.
4. Show paid users only paid-state copy; retain accurate preview and unlock copy for free users.
5. Show a compact first-month-complete review instead of a fully expanded historic timeline.

### Concern detail

1. Place Next step directly below the heading on mobile and in the desktop action column.
2. Preserve the existing action values and guidance ordering.
3. Use visual hierarchy for `Observe closely`, `Consider contacting a vet`, and `Seek urgent care` without implying a diagnosis.
4. Display sources, review dates, and rationale only when backed by stored content metadata.

### Profile, onboarding, login, and paywall

1. Group Profile into Pet details, Current concerns, Account, and Milestones.
2. Add submit-pending, success, and recoverable error feedback for profile updates.
3. Group onboarding into pet information, arrival context, and current concerns.
4. Show product navigation only for authenticated users and redirect authenticated users away from Login.
5. Rework Paywall around three values: next step, personalized context, and progress/reminders.
6. Keep the real one-time price, per-profile scope, refund period, and Creem disclosure visible before checkout.

## Phase 3: Trust Content and Account Controls

1. Add source title, source URL, and reviewed-at fields to concern guidance through a dedicated migration.
2. Extend types, queries, fixtures, and UI to conditionally show only real source metadata.
3. Add a `How we create guidance` page that states the education-only boundary, source selection process, and update process.
4. Add Privacy, Terms, Refund policy, Contact, and About routes plus footer navigation.
5. Add a user-owned data export request flow for profile, concerns, tasks, check-ins, milestones, and purchase state.
6. Add a confirmed pet-profile deletion flow that explains which data is permanently removed and any retention exception.
7. Add payment-status recovery content for pending checkout and a clear support route for refunds.

## Required Inputs Before Publishing Trust Pages

- Support email and operating entity name.
- Approved privacy, terms, and refund-policy content or an owner responsible for it.
- Public source URLs and review dates for guidance.
- Any real veterinary advisor name, qualification, review scope, and permission to publish.
- Required retention period for export and deletion requests.

## Verification

1. Run `npm test`, `npx tsc --noEmit`, `npm run build`, and `git diff --check`.
2. Validate Home, Plan, Concern, Profile, Onboarding, Login, Paywall, and Checkout Return in a real browser.
3. Validate desktop and 390px mobile layouts.
4. Cover unauthenticated, free, paid, after-first-month, overdue-task, no-concern, profile-saved, and pending-checkout states.
5. Verify keyboard focus, 44px touch targets, no horizontal overflow, and accurate source, pricing, privacy, and support content.
