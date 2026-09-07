# First Month Pet trust remediation

## Goal

Make the local First Month Pet experience credible by ensuring status labels are true, health guidance is clearly bounded and attributable, and account/payment/data claims are transparent.

## Confirmed facts

- Home selects the oldest overdue task yet labels it "Today's most important action" (`lib/app-data.ts:163-167`, `app/home/page.tsx:24`).
- Plan labels every elapsed node `completed` based only on date (`lib/app-data.ts:209-214`), including nodes with overdue tasks.
- Concern guidance has source metadata fields, but the seed data contains only generic source notes and no source title, URL, or review date (`supabase/migrations/002_seed.sql`, `20260903070000_add_guidance_source_metadata.sql`).
- Concern actions only save a progress selection; they do not contact a veterinarian (`app/concerns/[key]/page.tsx:24-39`).
- No public About, Guidance, Privacy, Terms, Refund, or Contact route exists. Login exposes the infrastructure vendor name rather than explaining data use.
- Paywall already uses a one-time $9.99 purchase and Creem checkout, but its recovery copy exposes implementation detail instead of user-facing expectations.

## Requirements

1. Replace date-derived "completed" states with truthful timeline/progress wording and accurately represent unfinished first-month tasks after Day 30.
2. Clarify concern-action consequences, education-only limits, and emergency escalation boundaries without implying diagnosis or veterinary contact.
3. Make source citation and review-date display available with safety guidance; keep only individualized rationale as paid context.
4. Replace implementation-oriented Login, Profile, Paywall, and Checkout Return copy with clear product, data-use, payment, and recovery language.
5. Add a minimal public trust-information structure only where its content is verified: guidance methodology, Refund, Contact, and About. Defer Privacy and Terms until a real registered legal entity is supplied.
6. Preserve existing Next.js, Supabase, Creem, native-form, server-action, and no-medical-diagnosis boundaries. Do not add dependencies, testimonials, certifications, or fabricated business/medical claims.
7. Provide a website-ready guidance-methodology page and source-card copy derived from verified public resources; only use it for the concern/species combinations documented in `research.md`.
8. Provide a contact-based data export and account-deletion request path. The Contact page must require identity verification before processing and distinguish provider-held payment records from application data; it must not promise an unimplemented self-service action or completion period.

## Acceptance Criteria

- [ ] A past timeline node is not labeled completed solely because its date elapsed; unfinished tasks remain visibly unfinished.
- [ ] A Day 31+ home screen does not describe an old overdue task as today's action or represent the full plan as complete while work remains.
- [ ] Concern pages say that actions save the user's intended next step and do not contact a veterinarian.
- [ ] Free and paid users can see real source title, URL, and review date when present; missing metadata is not replaced with invented claims.
- [ ] Guidance, Refund, Contact, and About claims contain only approved factual content; Privacy and Terms are absent until a legal entity is supplied.
- [ ] Paywall and checkout recovery copy state the one-time price, scope, free safety guidance, refund route, payment processor, and support path without exposing webhook/database terminology.
- [ ] The Contact page states how a user requests a structured copy of application data or account deletion and that identity verification is required before processing.
- [ ] The support runbook identifies the verified operator steps to export application data or delete the Auth user with cascading application data after an approved request; it does not claim to delete Creem's payment records.
- [ ] Tests cover the status semantics and free safety/source visibility; production build and browser checks pass for affected routes.

## Out of scope

- Veterinary chat, diagnosis, emergency-clinic search, new payment provider, analytics SDK, multi-pet support, testimonials, or invented legal/medical endorsements.

## Evidence status and blocking decision

Candidate public veterinary, privacy, and Creem references are recorded in `research.md`. They can support citations and editorial boundaries, but cannot establish this business's legal, support, data-processing, payment, or reviewer facts.

The user chose public competitor pages as a structure reference for Privacy, Terms, Refund, and Contact. Pawp and Pumpkin are recorded as structure-only references; their content will not be copied. Repository evidence now establishes the current data inventory and confirms that account export, user-initiated deletion, retention automation, cookie consent, and a support route do not yet exist.

Confirmed publication facts: support and refund requests use `wqy1994yeah@gmail.com`; the public contact location is `Hong Kong, China`. This location is not a legal-entity name or full postal address.

Decision: do not publish Privacy or Terms until a real registered legal entity is supplied. Do not substitute the contact location or support email for that identity.

Decision: follow the selected competitors' public pattern: data export and deletion are requested through the support contact, identity is verified before processing, and responses follow applicable law. This replaces an immediate self-service delete button.

Public legal pages remain blocked until the operating entity and policy facts are supplied. Refund, Contact, and guidance copy use only the approved facts above. The public sources mapped in `research.md` are selected as citations for their stated concern/species scope; `reviewed_at` remains absent until an actual content-owner review occurs.
