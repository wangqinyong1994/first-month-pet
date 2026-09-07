# Trust-content evidence inventory

Research date: 2026-09-04. This is an evidence inventory, not publishable legal or veterinary advice.

## Content that can be supplied from authoritative public sources

| Existing concern | Candidate source | Publishable, bounded use |
| --- | --- | --- |
| Any emergency concern | [MSD Veterinary Manual: What to Do in a Dog or Cat Emergency](https://www.msdvetmanual.com/special-pet-topics/emergencies/what-to-do-in-a-dog-or-cat-emergency) (pet-owner version; last updated Dec 2025) | Explain that emergency care starts with contacting a veterinarian; tell users the product is not an emergency service. |
| Cat not eating | [Cornell Feline Health Center: Anorexia](https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/anorexia) | Cite that sustained appetite loss can have varied causes and merits veterinary assessment. Cat-specific only. |
| Vomiting / diarrhea | [MSD: Disorders of the Stomach and Intestines in Cats](https://www.merckvetmanual.com/cat-owners/digestive-disorders-of-cats/disorders-of-the-stomach-and-intestines-in-cats) and the matching [dog-owner page](https://www.merckvetmanual.com/dog-owners/digestive-disorders-of-dogs/disorders-of-the-stomach-and-intestines-in-dogs) | Link users to species-specific educational material; do not convert the pages into diagnosis or fixed treatment instructions. |
| Coughing / nasal signs | [MSD: Clinical Signs of Respiratory Disease in Animals](https://www.merckvetmanual.com/respiratory-system/respiratory-system-introduction/clinical-signs-of-respiratory-disease-in-animals) | Support the boundary that breathing-related concern should be assessed by a veterinarian, rather than handled as an in-app remedy. |
| Urination difficulty | [MSD: Urethral Obstruction in Small Animals](https://www.merckvetmanual.com/urinary-system/urolithiasis-in-small-animals/urethral-obstruction-in-small-animals) (last updated May 2025) | Support a clearly urgent escalation cue. Avoid symptom thresholds unless a veterinary reviewer approves the exact wording. |
| Fleas / scratching | [RSPCA: How to Get Rid of Fleas](https://www.rspca.org.uk/adviceandwelfare/pets/general/fleas) | Give general welfare and environmental-care education. Regional products and dosing must not be prescribed. |
| Cat hiding / fear | [RSPCA: Understanding Your Cat's Behaviour](https://www.rspca.org.uk/adviceandwelfare/pets/cats/behaviour) | Explain that behaviour changes can have multiple causes; link to vet/qualified behaviourist escalation. Cat-specific only. |

## Policy and payment references

- [ICO privacy-information guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/) supplies a checklist for a transparent privacy notice; it does **not** supply this product's facts.
- [European Commission: information for individuals](https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en) is the authoritative EU-facing reference for individual data-protection rights.
- [Creem: Refunds and Chargebacks](https://docs.creem.io/merchant-of-record/finance/refunds-and-chargebacks) confirms that sellers choose their refund policy and that Creem may process refunds within 60 days to mitigate chargebacks. The product's displayed 7-day promise therefore needs an owner-approved procedure and support route.
- [Creem introduction](https://docs.creem.io/getting-started/introduction) describes Creem as merchant of record. Use this only after confirming the live account and checkout configuration actually use that model.

## Competitor structure reference (not copy)

- [Pawp Terms of Service](https://pawp.com/tos) opens with the legal entity, service scope, agreement to terms, and a visible last-updated date.
- [Pawp Privacy Policy](https://pawp.com/privacy-policy) opens with entity, service scope, a last-updated date, then separates information the user provides, information collected automatically, and information from third parties.
- [Pumpkin Privacy Policy](https://www.pumpkin.care/privacy-center/privacy-policy) identifies the operating entities and distinguishes necessary, functional, and sale/share cookie choices.

The applicable pattern for First Month Pet is: a readable summary first; facts that are specific to this product; an effective date; then the detailed policy. Do not reproduce competitor wording, legal entity details, arbitration clauses, or insurance-specific text.

## Confirmed current data inventory

Repository evidence supports disclosing the following current application data, but not any retention period or deletion service level:

| Category | Confirmed fields / purpose | System of record |
| --- | --- | --- |
| Account | Supabase Auth user and email-based sign-in session | Supabase Auth |
| Pet profile | Pet type, name, adoption date, age stage, health-record status, adoption source, arrival group, resident-pet flag | `pet_profiles` in Supabase Postgres |
| Plan and wellbeing activity | Concern selections, task completion, action choice, milestones, daily check-in status | Supabase Postgres |
| Purchase state | Creem customer, checkout and order identifiers, amount, currency, purchase/refund status and dates | Creem plus `purchases` in Supabase Postgres |
| Product activity | Named product events and timestamps; metadata is a JSON field | `product_events` in Supabase Postgres |
| Session | Authentication cookies used by the Supabase server client | Browser and Supabase Auth |

The repository has no account-deletion endpoint, export endpoint, retention job, cookie-consent mechanism, analytics SDK, or documented production data region. Therefore none of those may be claimed as currently available.

## Confirmed contact publication facts

- Support and refund requests: `wqy1994yeah@gmail.com`
- Public location label: `Hong Kong, China`

Use these for a simple Contact page and as the request channel in a future Refund page. Do not represent the location label as a registered address, data-controller identity, or legal notice address.

Decision: Privacy and Terms remain unpublished until the business supplies a real registered legal entity. Competitor layouts remain reference material only.

## Proposed policy decisions requiring implementation before publication

Competitor layouts are useful references, but they cannot select these facts for us:

1. **Retention** — a defensible default is to keep account and pet-plan data while the account remains active, then delete it after an authenticated deletion request within a stated window; purchase records may need a separate legally required retention rule. This is a proposal, not current behavior.
2. **Deletion and export** — the site needs an authenticated request flow, verified execution, and a support contact before promising either action. Cascades remove application rows if the Supabase Auth user is deleted, but no current user-facing flow invokes that deletion.
3. **Refund** — retain the advertised seven-calendar-day window only if the business agrees to process requests through the published support route. Creem's seller policy allows a seller-defined policy; it does not itself create this product's promise.
4. **Contact** — a visible support route must be owned and monitored. A fake inbox, competitor contact link, or unmonitored form is not publishable.

Decision: build an operator-verified export and deletion path. The application deletion boundary is the Supabase Auth user plus cascading application rows; it does not delete payment records held by Creem.

## Competitor deletion-request pattern

The selected competitors do not expose a publicly verifiable immediate-delete interaction. Pawp's public policy offers data portability, correction, deletion, restriction, and objection requests through its contact channel. Pumpkin's public policy directs access, deletion, review, and update requests to its Contact Us channel and says it may verify identity before acting.

Decision: First Month Pet follows this contact-based pattern. Users email `wqy1994yeah@gmail.com` to request export or deletion. The operator verifies identity before exporting data or deleting the Supabase Auth user and cascading application data. The page must not promise a fixed completion period until one is operationally approved.

## Facts that cannot be sourced externally and must be supplied or deliberately deferred

| Missing publishable fact | Owner/evidence needed |
| --- | --- |
| Legal entity, address, controller contact, governing law, effective date | Business owner / counsel |
| Support email or help route, response expectations | Support owner (email is confirmed; response expectation remains open) |
| Refund eligibility, start time, method, exceptions, and escalation route | Business owner and Creem-account operator |
| Currency, taxes, customer region availability, receipt and merchant-of-record wording | Live Creem configuration and business owner |
| Actual data inventory, processors, hosting regions, retention, deletion exceptions, export/delete process and response SLA | Engineering + privacy owner |
| Cookie/analytics use and age policy | Engineering + business owner |
| Named medical reviewer, credentials, approval scope and review cadence | Qualified reviewer; otherwise no reviewer claim |
| Final guidance source per concern/species and reviewed-at date | Content owner plus qualified veterinary review |

## Editorial rule before publishing

Store `source_title`, canonical `source_url`, and an actual `reviewed_at` date for each concern. Show them to every user. A source is a citation, not authorization to copy its advice or claim its endorsement. Publish only species-appropriate language and retain the existing education-only and emergency-escalation boundaries.

## Draft: website-ready guidance-methodology page

### How First Month Pet uses guidance

First Month Pet helps new pet parents organise their first-month tasks and recognise when to get professional help. It does not diagnose illness, prescribe treatment, or replace a veterinarian.

Our guidance is written for education and links to public veterinary or animal-welfare resources. Each concern should show its source and the date it was last reviewed. Sources help explain where the general information came from; they do not mean that the publisher endorses First Month Pet.

### When to contact a veterinarian

If you think your pet may be having an emergency, contact a veterinarian or emergency veterinary service now. Emergency care often starts with a call to a veterinarian, who can advise on safe next steps and transport. Do not wait for an in-app task or a reply from First Month Pet.

### What the buttons do

Choosing an action in First Month Pet saves your intended next step in your plan. It does not send a message, book an appointment, or contact a veterinarian on your behalf.

### How to use a source

Use the linked source as general background, then discuss your pet's own symptoms, history, and medicines with a veterinarian. Guidance is selected by species and concern; a cat-only source is not shown as dog guidance.

## Draft: source-card copy

**Source and review**  
This guidance is based on **{source_title}** by **{publisher}**. Last reviewed for First Month Pet on **{reviewed_at}**. [Read the source]({source_url})

**Important:** This is general education, not a diagnosis or treatment plan. If your pet seems unwell or you are worried, contact a veterinarian.

## Draft: concern-level, safe additions

| Concern | Draft addition | Required source selection |
| --- | --- | --- |
| Not eating or drinking | “A sustained loss of appetite can have many causes. For a cat, see the Cornell Feline Health Center resource below; contact a veterinarian if you are concerned.” | Cornell for cat flow; select a dog-specific source before showing this wording to dog owners. |
| Vomiting or diarrhea | “Stomach and intestinal signs can have different causes. Use the species-specific resource below as background and contact a veterinarian if you are concerned.” | MSD dog or cat page selected from the visitor's pet type. |
| Coughing or nasal signs | “Breathing and respiratory signs need veterinary assessment; this app cannot assess severity.” | MSD respiratory-signs resource. |
| Trouble urinating | “Difficulty passing urine can be urgent. Contact a veterinarian or emergency veterinary service now.” | MSD urethral-obstruction resource; keep as escalation, not diagnosis. |
| Scratching or fleas | “Fleas can affect both pets and the home. The linked welfare resource explains general signs and prevention; ask a veterinarian about products that are appropriate for your pet and region.” | RSPCA fleas resource. |
| Hiding or fear (cat) | “Changes such as hiding can have several causes. If the change persists or you are worried, speak to a veterinarian or qualified animal behaviourist.” | RSPCA cat-behaviour resource. |
