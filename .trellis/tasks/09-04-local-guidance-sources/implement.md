# Implementation plan

1. Verify whether `20260904100000_guidance_sources.sql` has reached the target database. Choose in-place correction only for an unapplied migration; otherwise create a forward-only migration.
2. Research the nine mapped concern/species rows. Record a private fact matrix that links each proposed statement to authoritative inputs, marks species scope, and records conflicts or omissions.
3. Write original, conservative First Month Pet copy for the existing `common_settling_in`, `ask_a_vet`, and `seek_urgent_care` fields. Seed the fixed copy in a versioned migration; do not add an article schema or runtime crawler.
4. Make provenance private: remove public `guidance_sources` select access, stop selecting the source relation in `staticContent()`, remove unused public source types/query code, and remove the public `/sources/[id]` route.
5. Update the concern page and guidance-methodology copy so expanded content appears directly with the existing education-only and emergency-care boundaries, without a source card, citation label, publisher name, URL, or review claim.
6. Update the trust contract and add focused checks for direct content visibility, cat/dog mapping, provenance privacy, absence of source traces in rendered output, and continued free-user access to safety guidance.
7. Run `npm test`, `npm run lint`, `npm run build`, and `git diff --check`. Inspect the scoped and full diff to ensure unrelated working-tree changes are untouched.
8. Apply the migration, verify representative authenticated cat/dog concern pages for free and paid states, inspect public HTML and database access boundaries, then verify the production routes. Roll back the app rendering change if content or privacy checks fail.

## Release gates

- Every published statement is supported conservatively by the private fact matrix; conflicting or unclear claims are omitted.
- No article claims veterinary review, diagnosis, treatment, dosage, or guaranteed accuracy.
- All nine current source mappings remain species-correct and no external provenance is exposed to users.
