# Trust remediation design

## Public routes and ownership

| Route | Purpose | Content source |
| --- | --- | --- |
| `/guidance` | Explain educational scope, emergency boundary, action-button behavior, and source-card meaning. | `research.md` veterinary copy |
| `/refund` | Describe the approved one-time-purchase refund process. | User-approved seven-day rule plus Creem docs |
| `/contact` | Publish the support email, location label, and data-rights request process. | User-confirmed contact facts and verified data inventory |
| `/about` | Explain the product's first-month planning purpose and its non-medical boundary. | Existing product scope and guidance copy |

Privacy and Terms are deliberately absent: neither the support email nor `Hong Kong, China` is a legal entity or notice address.

Use one small shared public-information layout/component only if the existing page styles need repeated heading/section/link structure; otherwise keep each route as a simple server component. Add public links in the layout footer so anonymous and signed-in visitors can reach these pages.

## Guidance and source metadata

`concern_guidance` already owns source title, URL, and review date. Seed only source title/URL pairs selected in `research.md`; keep `reviewed_at` null until a content owner supplies an actual review date. The concern UI renders citation metadata whenever present for both free and paid visitors. Paid-only filtering remains limited to individualized priority rationale.

The concern action server action continues to save only the chosen action. The page copy states that it does not contact a veterinarian, schedule care, or message support.

## Data and support boundary

Contact page copy lists the confirmed application data categories and directs export/deletion requests to the support email. It says requests require identity verification and that payment-provider records are handled separately; it makes no retention-period, deletion-time, or legal-jurisdiction claim.

Operational runbook: verify that the requester controls the signed-in account email, export only that account's application rows, and use the Supabase Auth user deletion operation after approval. Foreign keys configured with `on delete cascade` remove application rows. Do not present this operator path as a self-service feature.

## Refund boundary

The page and paywall use exactly: one-time purchase; request within seven calendar days after purchase; request via the support email; full refund to the original payment method; Creem processes the payment; no prorated refund. Do not claim tax, merchant-of-record, chargeback, or processing-time details not confirmed in the live configuration.

## Status correctness

Keep state derivation in `lib/app-data.ts`/`lib/domain.ts`, not pages. A past node with unfinished tasks must not derive `completed`; Day 31+ home copy must distinguish outstanding tasks from the completed first-month period.

## Rollback

Routes and copy can be reverted independently. Source metadata should be additive and nullable; remove an incorrect source URL/title rather than inventing a review date. Existing purchase and user data are not migrated or deleted by this work.
