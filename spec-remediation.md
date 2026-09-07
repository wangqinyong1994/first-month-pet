# First Month Pet Remediation Spec

Date: 2026-09-03

## Goal

Make first-month guidance safe for every user, keep materialized tasks aligned with profile changes, capture the smallest useful feedback and product metrics, and collect narrow multi-pet context without becoming a multi-pet product.

## P0 - Safety and task consistency

- Every concern detail page shows `Common settling-in`, `Ask a vet`, and `Seek urgent care` to free and paid users. `priority_reason` and `source_notes` remain paid-only context.
- Paid value remains the full 30-day timeline, personalized tasks, Milestones, concern rationale, and source notes. Paywall copy must not call urgent-care guidance a paid feature.
- `pet_tasks` gains `is_active boolean not null default true`.
- Profile creation and updates use one idempotent task synchronizer:
  - eligible task rows are upserted with the current due date and `is_active = true`;
  - ineligible rows become inactive, not deleted;
  - reactivated rows retain any existing completion state.
- Home, Plan, and derived milestone queries ignore inactive tasks.
- Profile input is server-validated: known enum values, non-empty trimmed name, and an ISO date no later than today.

## P1 - Check-in and measurement

- Add `pet_check_ins` with one daily row per profile and a status of `better`, `same`, or `worse`; it stores no free text or medical details.
- Home shows a free, accessible three-choice check-in. A `worse` result links to the existing concern editor and highest-priority concern guidance.
- Add private, server-written `product_events` with only allowlisted event names and compact metadata. Event failures must not block user flows.
- Capture onboarding views, profile creation, home views with current day, concern opens, task completion, check-in submission, paywall views, checkout starts, payment completion, and refunds.

## P2 - Bounded household context and completion handoff

- Add `arrival_group_size` (`one`, `two`, `three_plus`) and `has_resident_pets` to the sole pet profile.
- Add only two conditional tasks: separate-resource observation for multiple simultaneous arrivals, and slow introductions for resident pets.
- Day 31+ shows a completion handoff with active concerns and unfinished tasks. It explains that settling can continue for up to three months but creates no 90-day plan.

## Non-goals

- No additional pet profiles, pet switching, pair pricing, external notifications, veterinary chat, uploads, OCR, shelter workflow, or third-party analytics SDK.

## Verification

- Unit-test free safety guidance, task eligibility and reactivation, validation, check-in status, and post-month state.
- Run `npm test`, lint, and production build.
- Migration enables RLS for new user-owned data. Authenticated clients can use check-ins but cannot read or write analytics events.
