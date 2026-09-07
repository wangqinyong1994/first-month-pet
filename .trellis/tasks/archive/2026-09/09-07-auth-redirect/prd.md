# Fix production email auth redirect

## Goal

Trace and fix email login links redirecting to localhost:3000 in the deployed Netlify app.

## Confirmed facts

- `signInAction` in `app/actions.ts` sets Supabase `emailRedirectTo` from the request `origin`, falling back to `siteUrl()` when the header is absent.
- `siteUrl()` in `lib/env.ts` falls back to `http://localhost:3000` when `NEXT_PUBLIC_SITE_URL` is not set.
- The deployed app has no repository-level Netlify config; production runtime configuration is external.
- The callback route already redirects relative to the incoming request origin, so the reported localhost target is generated before callback handling.

## Requirements

- Ensure production magic-link requests never fall back to `http://localhost:3000`.
- Keep local development and production redirect origins explicitly separate: local `.env.local` remains development-scoped, while Netlify production receives its own `NEXT_PUBLIC_SITE_URL` value.
- Preserve the existing `/auth/callback` exchange flow.
- Keep the redirect target constrained to the current trusted site origin; do not accept a user-supplied redirect URL.
- Verify with focused tests/build and deploy the corrected production app.

## Out of scope

- Changing Supabase email copy, account settings, DNS, or unrelated authentication flows.

## Acceptance Criteria

- [x] Production `NEXT_PUBLIC_SITE_URL` resolves to `https://first-month-pet.netlify.app`, so magic-link fallback no longer targets localhost.
- [x] Local development remains separately configured through `.env.local` and is not overwritten by the production setting.
- [x] Existing callback session exchange code remains unchanged.
- [x] Netlify production build passes and the deployed production login route returns HTTP 200.

## Open questions

- None; use environment-scoped `NEXT_PUBLIC_SITE_URL` values rather than a shared hard-coded production URL.

## Verification record

- Local `.env.local` retains a development-scoped URL.
- Netlify production variable verified as `https://first-month-pet.netlify.app`.
- Production deploy: `https://6a9e7ed316ff4e00ac32cc1e--first-month-pet.netlify.app`.
- Production login response: `HTTP/2 200`.
- No application source files changed; `git diff --check` passed.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
