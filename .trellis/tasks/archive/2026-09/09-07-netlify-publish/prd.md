# Update and publish to Netlify

## Goal

Verify the current clean main build and publish the existing project to the linked Netlify production site.

## Confirmed facts

- The repository is clean on `main` at commit `f654b73` (`feat: update1`).
- The app is a private Next.js 15 project with `npm run build`, `npm run lint`, and `npm test` scripts.
- No `netlify.toml` or local `.netlify/state.json` is present; site linkage and build settings must be verified through Netlify CLI/account state.

## Requirements

- Keep the current application code unchanged unless the production build exposes a release-blocking issue.
- Run the smallest relevant local quality checks before deployment: production build and diff/status verification; run lint/tests if the build path requires additional diagnosis.
- Verify Netlify authentication and site linkage before uploading.
- Publish the verified current build to the Netlify production environment.
- Report the resulting deploy URL, production site URL, and any unresolved environment or configuration blocker.

## Out of scope

- New product features, design changes, dependency upgrades, Netlify environment-variable edits, or DNS/domain changes.

## Acceptance Criteria

- [x] `npm run build` succeeds on the clean current checkout.
- [x] `npm run build` succeeds on the clean current checkout.
- [x] Netlify CLI confirms authenticated access and identifies `first-month-pet` (`https://first-month-pet.netlify.app`).
- [x] A production deploy completes successfully and returns a deploy/site URL.
- [x] The working tree remains free of unintended source changes after removing the generated `deno.lock`.

## Open questions

- None; “发布” is interpreted as a production deploy to the existing linked Netlify site.

## Verification record

- `npm test`: 15 passed.
- `npm run build`: passed; Next.js emitted one existing `useEffect` dependency warning.
- `npm run lint`: blocked by generated `.netlify` vendor files referencing unavailable ESLint rules; no application source was changed.
- `git diff --check`: passed.
- Live production response: `HTTP/2 200`.
- Deploy URL: `https://6a9e79f9c923e25432a72989--first-month-pet.netlify.app`.
- Build logs: `https://app.netlify.com/projects/first-month-pet/deploys/6a9e79f9c923e25432a72989`.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
