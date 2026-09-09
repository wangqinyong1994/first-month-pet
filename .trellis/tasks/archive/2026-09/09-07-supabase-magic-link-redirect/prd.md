# Fix Supabase magic-link localhost redirect

## Goal

Inspect and correct Supabase Auth URL configuration and Magic Link template so production emails redirect to Netlify.

## Confirmed facts

- Supabase Site URL was `http://localhost:3000` and there were no allowed Redirect URLs.
- Supabase Site URL is now `https://first-month-pet.netlify.app`.
- The allowed callback URLs now include production and local development:
  - `https://first-month-pet.netlify.app/auth/callback`
  - `http://localhost:3000/auth/callback`
- The Magic Link template uses `{{ .ConfirmationURL }}`, which is correct; it preserves the redirect target supplied by Auth.
- The application currently prefers the request `Origin` header over the environment-scoped `siteUrl()`. On Netlify server actions this can resolve to an internal/local origin, so production must use the explicit environment URL.

## Requirements

- Use the environment-scoped `NEXT_PUBLIC_SITE_URL` as the canonical magic-link callback origin.
- Preserve local development separation through `.env.local` and the local allowed callback URL.
- Keep the Supabase Magic Link template on `{{ .ConfirmationURL }}`.
- Verify production requests generate a Netlify callback and deploy the code fix.

## Out of scope

- Changing the email template copy or removing the local development callback.

## Acceptance Criteria

- [x] Production magic-link requests use `https://first-month-pet.netlify.app/auth/callback` via `siteUrl()`.
- [x] Local development continues to use its environment-scoped callback.
- [x] Supabase URL Configuration retains both production and local callback URLs.
- [x] Build/tests pass and the production deployment is reachable.

## Open questions

- None; the remaining fix belongs in `signInAction` by removing the request-origin override.

## Verification record

- Changed `app/actions.ts` to use `${siteUrl()}/auth/callback` and removed the request `Origin` override.
- `npm test`: 15 passed.
- `npx eslint app/actions.ts`: passed.
- `npm run build`: passed with the existing unrelated `milestone-moment.tsx` hook warning.
- Netlify production deploy `6a9e8b2977381467cdefe53b` completed; production login returns `HTTP/2 200`.
- Supabase Site URL and callback allowlist were corrected in the dashboard.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
