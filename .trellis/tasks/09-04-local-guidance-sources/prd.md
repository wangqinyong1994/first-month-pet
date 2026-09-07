# Localized guidance knowledge

## Goal

Let users read complete, useful pet-care guidance inside First Month Pet without navigating to an external website or seeing external-source presentation in the product UI.

## Confirmed facts

- `concern_guidance` already contains user-facing common, vet, and urgent-care copy.
- The current source seed maps 9 guidance rows to 7 distinct publisher URLs, including species-specific MSD and Cornell/RSPCA references.
- The in-progress implementation already has a `guidance_sources` entity and a public `/sources/[id]` route, but it currently models short attributed summaries rather than localized knowledge articles.
- The workspace contains unrelated uncommitted changes; implementation must layer on them and must not revert or reformat them.
- Some selected publishers restrict reproduction or require permission for reuse. Public content must therefore be independently written synthesis, not copied text, close paragraph-by-paragraph rewriting, or a mirrored external page.
- No qualified veterinary reviewer is available. The product must not claim veterinary review, certification, guaranteed accuracy, or a veterinary review date.

## Product decisions

- Users must not need to open an external website to understand the guidance.
- User-facing pages must not show external URLs, publisher names, citation labels, or other external-source presentation.
- External material is research input only. Published wording becomes original First Month Pet educational content adapted to the concern, species, and first-month context.
- Content is stored as a fixed, versioned internal resource. There is no automatic external synchronization.
- Source count is driven by whether the subject can be explained clearly and conservatively, not by a fixed quota.
- Localized knowledge is displayed directly on each concern page; users do not navigate to a separate source or article page.

## Requirements

1. Replace the short attributed-summary experience with substantial, independently written knowledge displayed directly on each supported concern/species page.
2. Keep content species-specific where the underlying evidence is species-specific; never expose cat-only conclusions as dog guidance or vice versa.
3. Keep private provenance for every article: researched URL, publisher/title, retrieval date, and the article version it informed. This evidence is for maintainers and correction only and must not be returned through public application queries or rendered in user-facing HTML.
4. Cross-check material against authoritative veterinary, university, government, or established animal-welfare resources where available. If reliable sources conflict or a claim cannot be supported confidently, omit the claim or keep the article unpublished.
5. Write original First Month Pet prose. Do not copy external paragraphs, perform close structural rewriting, import external images, or present a publisher's content as First Month Pet's own work.
6. Limit health content to general education: what a sign can broadly mean, what users can observe safely, when to contact a veterinarian, and urgent escalation cues. Do not diagnose, prescribe treatment, recommend drug doses, or replace professional care.
7. Retain the existing visible education-only and emergency-escalation boundaries. Do not add a claim that the content was reviewed by a veterinarian.
8. Publish a fixed article version only after source cross-checking, species-scope checks, and contradiction review are complete. Later changes create a new checked version rather than silently synchronizing external text.
9. Do not add a runtime crawler, scheduled sync, external HTML snapshot, image copy, or new scraping dependency.

## Acceptance criteria

- [ ] Each supported mapped concern/species can present enough original in-app content for the user to understand the topic and next-step boundaries without visiting an external site.
- [ ] User-facing pages and client-visible payloads contain no external source URL, publisher attribution, citation UI, or external-source link for localized articles.
- [ ] Maintainers can trace each published article version to its private research inputs without exposing those inputs publicly.
- [ ] Cat and dog content mappings remain species-correct.
- [ ] Published content contains no copied or closely rewritten external passages, diagnosis, treatment prescription, or medication dosage.
- [ ] Unsupported, conflicting, or insufficiently checked claims are omitted or remain unpublished.
- [ ] Existing general-education and emergency-care warnings remain visible.
- [ ] No automatic crawler or synchronization path is added.
- [ ] Focused content-visibility and species-mapping checks pass, followed by `npm test`, `npm run lint`, `npm run build`, and `git diff --check`.

## Out of scope

- External full-text reproduction or mirroring.
- Runtime crawling, scheduled change detection, automatic publishing, image ingestion, or a CMS/editor workflow.
- Veterinary certification or claims of professional review.
- Removing private provenance required for maintenance and correction.

## Release gate

No localized article is published when its species scope is ambiguous, its material conflicts across reliable sources, or its wording could reasonably be read as diagnosis or treatment. The existing legacy concern guidance remains the fallback until localized content passes these checks.
