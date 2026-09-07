# DTC public first visit design

## Boundaries

- `app/page.tsx` remains the sole root-route decision point. It checks the existing Supabase session first: authenticated requests keep the profile redirect; anonymous requests render the landing page.
- `getPublicLandingData()` is the sole server-data boundary for the anonymous page. Its field-level Supabase queries return only the free preview body, metadata-only locked nodes, and the two eligible free tasks before constructing the public projection.
- The free Day 1 node may expose its existing `free_preview` fields. Every later node is reduced to `id`, `title`, `day_start`, and `day_end`; paid narrative fields never cross into the component/RSC payload.
- The public task list is limited to the two unconditional, non-paid definitions attached to Day 1. It cannot use profile-triggered definitions because the route has no profile.
- The login action, callback, onboarding, events, database schema, and paid gate remain unchanged.

## Data flow

```text
anonymous / -> getPublicLandingData -> static content -> public projection -> server-rendered landing
authenticated / -> getProfile -> /home or /onboarding
landing CTA -> /login -> existing Magic Link -> existing authenticated funnel
```

## Safety and compatibility

- The landing describes guidance as general support, not diagnosis or treatment, and retains the approved urgent-care wording from the free Day 1 node.
- No anonymous identifier, event, cookie, query parameter, or persistence is introduced.
- The read-only Supabase admin query remains server-only. Only the explicit projection is rendered, so neither HTML nor RSC exposes paid plan copy or user data.
- Rollback is limited to restoring the old root redirect; no data migration or stored state is involved.

## Original visual system

- Local `public/images/first-month-pet/` assets provide the warm, documentary-style scenes; every route renders them with `next/image`, never a third-party image service.
- `lib/visuals.ts` owns the fixed image paths and the cat/dog selection used for signed-in plan and profile pages. These are explicitly illustrative scenes, not images of a user’s pet.
- Images follow the surrounding page copy and actions on small screens. Concern actions and urgent-care text remain before their supporting image; payment and support images make no confirmation, medical, or policy claims.
