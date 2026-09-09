# Integrate Resend SMTP with Supabase Auth

## Goal

Configure a verified Resend sender and connect its SMTP credentials to Supabase Auth for production magic-link delivery.

## Confirmed facts

- Resend account access is available, but the account currently has no custom verified domains.
- User supplied a Resend API key for configuration; it must not be committed or echoed.
- Free-plan testing can use Resend's restricted sender flow for the account/team mailbox, but arbitrary production recipients require a verified custom domain.

## Requirements

- Configure Supabase Auth SMTP with Resend SMTP host, port, username, and the supplied API key as password.
- Use the free-plan test sender only for validating delivery to the organization member mailbox.
- Keep all credentials in Supabase/Resend secret settings; do not write them to repository files or Netlify variables.
- Verify a fresh magic-link request after configuration.

## Out of scope

- Purchasing a plan, registering a domain, or adding DNS records for a custom sender.
- Enabling arbitrary-recipient production delivery without a verified domain.

## Acceptance Criteria

- [x] Supabase Auth SMTP settings save successfully with Resend free SMTP credentials.
- [x] A fresh magic-link request to the organization member mailbox is accepted by Supabase after SMTP configuration.
- [x] No API key is committed, logged, or added to Netlify.
- [x] The remaining custom-domain requirement is documented.

## Open questions

- None for the free-plan test scope; custom-domain production delivery remains deferred.

## Verification record

- Supabase Auth SMTP was enabled with Resend SMTP Relay (`smtp.resend.com`, port 465, username `resend`).
- Sender configured as `onboarding@resend.dev` for the free-plan test scope.
- Direct Supabase OTP request for the organization member mailbox returned `{}` after configuration; the prior `429 over_email_send_rate_limit` was cleared by custom SMTP.
- No repository files or Netlify environment variables were changed.
- The supplied Resend API key should be revoked/rotated after this setup because it was shared in chat.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
