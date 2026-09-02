# First Month Pet

English MVP for a one-pet, first-month onboarding plan using Next.js, Supabase Auth/Postgres, and Creem Checkout.

## Setup

1. Create a Supabase project and run:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_seed.sql`
2. Copy `.env.example` to `.env.local` and fill the values.
3. Configure Supabase email magic links to redirect to `/auth/callback`.
4. Set `CREEM_ENVIRONMENT=test` locally. The server then uses `https://test-api.creem.io` and only reads `CREEM_TEST_API_KEY`, `CREEM_TEST_WEBHOOK_SECRET`, and `CREEM_TEST_PRODUCT_ID`.
5. For production, set `CREEM_ENVIRONMENT=production`; it uses `https://api.creem.io` and the matching `CREEM_LIVE_*` variables.
6. Point the Creem webhook to `/api/creem/webhook` for:
   - `checkout.completed`
   - `refund.created`

## Commands

```bash
npm install
npm run dev
npm test
npm run build
```

## Boundaries

- Static paid content is stored in Supabase tables, but those tables have RLS enabled without client read policies. Server routes and server components return gated data.
- `purchases` is readable by the user and writable only through server-side service-role flows.
- Checkout Return never unlocks access from a URL parameter. It only reads local purchase state.
