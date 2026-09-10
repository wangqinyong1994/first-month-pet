# Project health remediation design

## Scope and boundaries

The remediation keeps the current Next.js, Supabase, Creem, Server Action, native-form, and Radix patterns. It changes only the smallest owning layers: auth callback/login, checkout creation/status, webhook/event persistence, Supabase schema/RPCs, configuration/headers, focused form styling/validation, tests, and operating documentation.

The migration is additive. It does not rename historical migration files or rewrite the remote ledger. It is applied only after local verification and the user's recorded authorization.

## Payment invariants

1. One pet has at most one active `pending` purchase.
2. A `pending` purchase may become `paid` or `failed`/`canceled`; a `paid` purchase may become `refunded`; `refunded` is terminal.
3. A webhook event has one active processor. A failed processor releases the event for provider retry; a completed event is acknowledged without side effects.
4. A webhook is successful only when its domain transition is applied or proved already applied. An unmatched refund remains retryable.

## Database contract

Add one timestamped forward migration that:

- adds `creem_checkout_url` to `purchases` so a repeated checkout action can return the existing hosted checkout rather than create another;
- creates a partial unique index for one `pending` purchase per pet;
- adds `processing_at` to `creem_events`;
- defines server-only RPCs for atomic purchase acquisition and atomic event claim/release/complete bookkeeping;
- hardens `sync_pet_profile` with the same no-future-adoption-date rule that the server action uses; and
- revokes anonymous/authenticated execution for the server-only RPCs.

The event-claim RPC receives event ID/type, inserts an event when absent, and returns `true` only when it atomically obtains an unprocessed, non-active claim. A retryable failure clears the active claim and records a bounded error. Completed-event rows return `false`.

The checkout-acquisition RPC receives user/profile IDs, validates ownership, returns an existing pending purchase when present, and otherwise creates one. Server code stores the provider checkout ID and URL only after Creem succeeds; if Creem fails, it marks the owned pending row failed before returning an error.

## Server flow

### Auth callback

`safeCallbackPath` remains the only destination parser. The callback branches on `exchangeCodeForSession` error and redirects to `/login?error=invalid_link`; the login page maps that code to an actionable message.

### Checkout

`createCheckoutSessionAction` obtains one pending purchase atomically. If it has a stored checkout URL, it redirects there. If it has no URL, it creates the provider checkout using that existing purchase ID as `request_id`, persists ID/URL, records analytics, and redirects. Provider creation/persistence failure changes the purchase to `failed` and returns a clear retryable server error. `checkoutStatus` returns a distinct `not_found` state for an unknown caller-owned checkout ID; return-page/API rendering handles it without implying a pending payment.

### Webhook

After HMAC and payload validation, the route atomically claims the event. It acknowledges an already-completed or currently-owned duplicate without rerunning side effects. For `checkout.completed`, it updates only the matching `pending` purchase. For `refund.created`, it updates only the matching `paid` purchase. If a matching row is already terminally correct, it completes the event without duplicate analytics. If no matching row is available, it records a retryable failure and returns non-2xx. Every event bookkeeping write checks its Supabase result.

## UI and configuration

- Use the existing Radix/theme CSS selectors to apply the 44px minimum to the login and profile controls.
- Convert onboarding to the existing `useActionState` error-display pattern, keep redirects outside its catch boundary, enforce `max=today`, and retain server/DB validation.
- Ignore `.netlify/**` in the flat ESLint configuration and include `searchParams` in the milestone effect dependencies.
- In production, require a valid HTTPS `NEXT_PUBLIC_SITE_URL` and explicit valid `CREEM_ENVIRONMENT`; development keeps the existing localhost/test defaults.
- Add production response headers through `next.config.mjs`: CSP compatible with self-hosted Next/Radix/Supabase connectivity, `frame-ancestors 'none'`/`X-Frame-Options`, Referrer-Policy, Permissions-Policy, and nosniff. Verify the rendered login and protected flows after deploy.

## Tests and rollout

- Unit-test environment parsing, auth callback target/error behavior, checkout status, and component/form validation paths where current test infrastructure permits.
- Add webhook route tests with mocked Supabase/Creem dependencies for claim, retry, duplicate, paid/refunded transition, unmatched refund, and bookkeeping failure paths.
- Add database verification queries after migration: columns/functions/grants/index and purchase/event transition behavior on a dedicated development record only.
- Run test, TypeScript, lint, build, and diff checks. Then apply the additive migration to the authorized environment, deploy production, and repeat the callback header probe plus mobile login/profile and post-first-month protected-route checks.

## Rollback

Application rollback is a redeploy of the prior artifact. The migration avoids destructive changes; if an application rollback is necessary, the added nullable columns/functions/index can remain. Do not remove payment-event records or production purchases as rollback.
