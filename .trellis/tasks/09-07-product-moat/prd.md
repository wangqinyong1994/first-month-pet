# Design a defensible moat

## Goal

Define a defensibility strategy for First Month Pet that compounds from the current local product rather than imitating veterinary telehealth, generic free guides, or dog-training subscriptions.

Deliver the approved DTC first-visit route: anonymous visitors see a useful, public Day 1 experience before the existing account step; authenticated visitors retain the current profile-based destination.

## Requirements

- The local product turns one cat or dog profile, adoption date, health-record status, selected concerns, simultaneous arrivals, and resident-pet context into a 30-day task plan.
- Free users retain veterinary-contact and urgent-care guidance; paid users unlock the full plan, conditional tasks, milestones, and concern rationale for a one-time $9.99 purchase.
- The local system already records profile creation, plan use, concern opens, task completion, check-ins, checkout, purchase completion, and refunds as private events.
- Current alternatives are strong in separate jobs: free shelter guidance, dog-training progression plus experts, and on-demand veterinary access. The product must not claim to replace professional care.

### Strategy requirements

1. Identify one primary customer/distribution wedge and two reinforcing moat layers that fit the existing MVP.
2. Specify the compounding asset, the data it requires, the consent/safety boundary, and the proof metric for each layer.
3. Distinguish product capabilities to build now from partnership, content-operation, or sales work that cannot be solved in code.
4. Explicitly reject non-defensible expansion paths.

## Key decision

- Initial buyer and user: direct-to-consumer, English-speaking first-time cat or dog adopters in their first 30 days.
- The strategy must therefore earn repeatable organic intent and product trust; it cannot assume shelter, veterinary, or retailer distribution exclusivity.

### Out of scope

- Building telehealth, a generic AI medical advisor, long-term pet management, a training-video library, or multi-pet SaaS.
- Claiming that anonymous usage data, static content, or a payment integration alone is a moat.
- Guest profiles, anonymous cookies or events, third-party analytics, database migrations, or medical diagnosis and consultation.

## Acceptance Criteria

- [x] Names a primary wedge with a clear first buyer and user.
- [x] Defines 2-3 assets that become stronger with each eligible customer or partner.
- [x] Gives a minimal staged plan and measurable disproof conditions.
- [x] States safety, data, and operational boundaries.
- [ ] Anonymous `/` renders a public Day 1 landing page whose primary CTA goes to `/login`.
- [ ] Authenticated `/` requests still redirect to `/home` with a profile and `/onboarding` without one.
- [ ] The public RSC payload contains only the free Day 1 body, two unconditional free Day 1 tasks, urgent-care guidance, and metadata-only locked timeline entries.
- [ ] `/login` retains Magic Link success/error behavior while framing the step as creating and saving the free Day 1 plan.
- [ ] Local original visual assets support the public, account, plan, safety, payment, and public-information routes without changing care, auth, or payment behavior.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
