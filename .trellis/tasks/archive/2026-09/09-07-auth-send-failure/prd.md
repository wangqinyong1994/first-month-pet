# Fix production email sign-in failure

## Goal

Diagnose the deployed email sign-in send_failed error and restore production auth configuration safely.

## Confirmed facts

- `signInAction` creates the Supabase server client and redirects to `send_failed` whenever `signInWithOtp` returns an error.
- The server client requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; admin flows additionally require `SUPABASE_SERVICE_ROLE_KEY`.
- Netlify Production currently contains only `NEXT_PUBLIC_SITE_URL`; the Supabase variables are absent.
- Local `.env.local` contains the project-specific Supabase configuration and remains development-scoped.

## Requirements

- Add the required Supabase auth variables to Netlify Production without exposing their values in source or user-facing output.
- Keep local `.env.local` values separate and unchanged.
- Redeploy so server runtime receives the production variables.
- Verify the production login route and preserve the existing error handling.

## Out of scope

- Changing Supabase email templates, database schema, auth provider settings, or unrelated Creem configuration.

## Acceptance Criteria

- [x] Netlify Production contains the Supabase URL and anon key required by `createSupabaseServerClient`.
- [x] Production deployment completes successfully.
- [x] Production login page remains reachable; the missing-variable blocker is removed from the auth action.
- [x] Local environment configuration is unchanged and no secret is committed.

## Open questions

- None; repository evidence identifies missing production Supabase variables as the release blocker.

## Verification record

- Production environment now contains `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and secret-scoped `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Netlify production build completed and deployment went live (deploy id `6a9e82b8f88838169d83feeb`).
- `https://first-month-pet.netlify.app/login` returns `HTTP/2 200`.
- `git diff --check` passed; no application source or local environment files changed.
- End-to-end inbox delivery was not exercised from this environment; request a new link from the deployed login page for final user verification.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
