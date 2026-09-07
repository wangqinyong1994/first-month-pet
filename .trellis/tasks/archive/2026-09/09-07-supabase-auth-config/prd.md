# Verify Supabase production auth URLs

## Goal

Diagnose persistent production email sign-in failure by verifying Supabase production URL and redirect configuration.

## Confirmed facts

- The connected Supabase project `first-month-pet` (`efcnrlylglcjfzgztgmm`) is active and healthy.
- The application calls `signInWithOtp` with `/auth/callback` as the redirect target.
- Supabase documentation requires the production Site URL and callback URL to be present in Auth URL Configuration.
- Supabase's hosted default email service is restricted to pre-authorized organization team addresses; production delivery to arbitrary users requires custom SMTP.

## Requirements

- Verify the Supabase Auth Site URL is `https://first-month-pet.netlify.app`.
- Verify `https://first-month-pet.netlify.app/auth/callback` is in the allowed Redirect URLs.
- Verify email delivery configuration supports the user's target mailbox; configure custom SMTP if the mailbox is not a project team address.
- Keep the application and database unchanged unless verification exposes a code defect.

## Out of scope

- Inventing SMTP credentials or changing database schema.

## Acceptance Criteria

- [x] Supabase project connection is verified.
- [x] The production callback URL is accepted far enough for Supabase to return its email rate-limit error; no redirect rejection was observed.
- [x] Email delivery failure is identified as `429 over_email_send_rate_limit` for an organization-member mailbox.
- [ ] A fresh production magic-link request can be tested after the rate limit window resets.

## Open questions

- SMTP provider credentials are not available in the repository; custom SMTP setup requires the user's provider choice and credentials if the mailbox is not pre-authorized.

## Verification record

- Supabase MCP connection verified project `efcnrlylglcjfzgztgmm` as `ACTIVE_HEALTHY`.
- Direct `POST /auth/v1/otp` using the production callback URL returned `429 over_email_send_rate_limit`.
- The tested mailbox is an organization member, so the current blocker is the Supabase email send rate limit, not missing Netlify variables or an invalid redirect URL.
- No application, database, or external configuration was changed in this diagnostic task.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
