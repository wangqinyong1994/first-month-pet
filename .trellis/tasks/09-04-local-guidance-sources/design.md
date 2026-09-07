# Technical design

## Ownership and data boundary

`concern_guidance` already owns the concern- and species-specific content rendered on the concern page. Expand its existing `common_settling_in`, `ask_a_vet`, and `seek_urgent_care` values instead of adding a second article model or a markdown renderer.

Keep `guidance_sources` and `concern_guidance.source_id` only as private provenance. The existing source rows provide publisher/title/URL evidence for maintainers, while the versioned SQL seed and task research record which inputs informed each concern row. Do not populate or expose a veterinary `reviewed_at` claim. Remove public select access to `guidance_sources`, stop joining the source relation in `staticContent()`, and do not return provenance through any public query.

Before changing migrations, verify whether `20260904100000_guidance_sources.sql` has been applied to the target database. If it is unapplied, correct the uncommitted migration in place. If it is already applied, add a forward-only migration that removes public source access without rewriting history.

## Research and content flow

For each of the nine existing concern/species source mappings:

1. Read the mapped authoritative page and additional authoritative material needed to resolve the topic safely.
2. Record a private fact matrix with species scope, agreement or conflict, and the public wording decision.
3. Write original First Month Pet prose into the three existing guidance sections.
4. Omit unsupported, conflicting, diagnostic, treatment, or dosage claims.
5. Seed the fixed wording through a versioned migration.

This is a one-time editorial research flow, not application crawling. No external HTML, images, or copied passages are stored.

## Rendering

Render the expanded guidance directly in `app/concerns/[key]/page.tsx` using the existing Common settling-in, Ask a vet, and Seek urgent care sections. Remove the source card and the public `/sources/[id]` route. Keep the existing education-only and emergency-care warning at the top of the page. No external source URL, publisher name, citation label, or separate knowledge-page navigation appears in rendered HTML.

## Compatibility and rollback

Retain legacy source columns and private provenance rows during this release so the content mapping remains recoverable. Application rollback restores the prior concern rendering; database rollback is not required because content and access changes are additive or forward-only. Remove legacy source fields only in a separate cleanup after production verification.

## Verification

Check all nine mapped rows for species correctness and prohibited medical claims. Verify representative cat and dog concern pages as free and paid users, inspect rendered HTML for publisher names and external source URLs, and confirm anonymous/authenticated clients cannot select `guidance_sources`. Then run unit tests, lint, build, diff checks, and production route checks after migration.
