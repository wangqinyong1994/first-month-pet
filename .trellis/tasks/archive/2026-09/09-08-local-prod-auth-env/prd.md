# Separate local and production auth URLs

## Goal

Ensure local email login uses localhost:3000 while Netlify production uses the public site URL, without leaking local env into production builds.

## Confirmed facts

- `siteUrl()` already reads `NEXT_PUBLIC_SITE_URL` and falls back to `http://localhost:3000`.
- `app/actions.ts` uses `siteUrl()` for auth callback and checkout URLs.
- The ignored local `.env.local` currently sets `NEXT_PUBLIC_SITE_URL` to an ngrok URL, not localhost.
- Netlify Production has its own `NEXT_PUBLIC_SITE_URL=https://first-month-pet.netlify.app` variable.
- Supabase Auth allowlist contains both production and localhost callback URLs.

## Requirements

- Set local `.env.local` to `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
- Keep production URL only in Netlify Production configuration.
- Ensure deployment verification uses the production environment value rather than the local ignored file.
- Preserve local and production Supabase callback allowlist entries.

## Out of scope

- Changing Supabase SMTP, email templates, or unrelated environment variables.

## Acceptance Criteria

- [x] Local `.env.local` resolves to `http://localhost:3000`.
- [x] Netlify Production retains `https://first-month-pet.netlify.app` from the existing production variable.
- [x] Local and production auth callback URLs remain accepted by Supabase.
- [x] Tests pass, `git diff --check` passes, and no secret is committed.

## Open questions

- None; environment-scoped values are already the responsible ownership boundary.

## Verification record

- Updated only ignored `.env.local`: `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
- `npm test`: 15 passed.
- `git diff --check`: passed; no tracked source changes were introduced.
- Production Netlify and Supabase settings were left unchanged.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
