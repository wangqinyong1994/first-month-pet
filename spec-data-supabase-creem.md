# First Month Pet Data Model And Supabase/Creem Technical Spec

Date: 2026-09-02

## Scope

This spec defines the MVP data model, Supabase access model, Creem Checkout flow, payment status, and unlock logic.

It does not create migrations, write code, or configure Creem/Supabase. Implementation must wait for explicit confirmation.

## External References Checked

- Supabase Auth supports magic link / email OTP flows and integrates Auth JWTs with database access control through Row Level Security: https://supabase.com/docs/guides/auth
- Supabase RLS should be enabled on tables in exposed schemas, with policies that combine `TO authenticated` and ownership predicates: https://supabase.com/docs/guides/database/postgres/row-level-security
- Creem creates hosted one-time checkout sessions with product metadata: https://docs.creem.io/api-reference/endpoint/create-checkout
- Creem fulfillment should listen for `checkout.completed`; redirects alone are not reliable fulfillment: https://docs.creem.io/code/webhooks

## Architecture

Recommended MVP stack:

- Supabase Auth for email magic link login.
- Supabase Postgres for app data.
- Row Level Security on all user-owned tables.
- Server-only Creem integration for Checkout Session creation and webhook handling.
- Creem-hosted Checkout for payment collection.

Client must never receive:

- Supabase service role key.
- Creem API key.
- Creem webhook signing secret.

## Authentication

Login method:

- Email magic link.

Production requirement:

- Configure a custom SMTP provider for Supabase Auth before production email delivery.

Session model:

- User identity comes from Supabase Auth.
- User-owned app rows use `user_id = auth.uid()`.

Do not use user-editable metadata for authorization decisions.

## Core Tables

### pet_profiles

Purpose:

- Stores the one new pet profile for a user.

Columns:

- id uuid primary key.
- user_id uuid not null references auth.users(id).
- pet_type text not null.
- name text not null.
- adoption_date date not null.
- estimated_age_stage text not null.
- health_records_status text not null.
- adoption_source text not null.
- arrival_group_size text not null default `one`.
- has_resident_pets boolean not null default false.
- created_at timestamptz not null default now().
- updated_at timestamptz not null default now().

Suggested constraints:

- pet_type in `cat`, `dog`.
- estimated_age_stage in `kitten_puppy`, `adult`, `senior`, `unknown`.
- health_records_status in `yes`, `no`, `not_sure`.
- adoption_source in `shelter`, `breeder`, `friend`, `stray`, `other`.
- arrival_group_size in `one`, `two`, `three_plus`.

MVP invariant:

- One active pet profile per user.

Recommended implementation:

- Enforce with a unique partial index on user_id for active profiles if soft delete exists.
- If no soft delete exists, use a unique index on user_id.

### pet_concerns

Purpose:

- Stores the user's selected current concerns for the pet.

Columns:

- id uuid primary key.
- pet_profile_id uuid not null references pet_profiles(id) on delete cascade.
- user_id uuid not null references auth.users(id).
- concern_key text not null.
- selected_at timestamptz not null default now().
- cleared_at timestamptz.

Suggested concern_key values:

- not_eating_or_drinking.
- diarrhea_or_unusual_stool.
- vomiting.
- hiding_or_fearful.
- coughing_sneezing_or_nasal_discharge.
- low_energy_or_weakness.
- scratching_fleas_or_skin_issue.
- litter_box_or_potty_accidents.
- no_concern_right_now.

Invariant:

- `no_concern_right_now` should not be active with any other active concern.

### care_plan_nodes

Purpose:

- Stores static timeline node definitions.

Columns:

- id text primary key.
- node_type text not null.
- day_start int not null.
- day_end int not null.
- title text not null.
- common_signs text not null.
- what_to_do text not null.
- when_to_seek_help text not null.
- free_preview boolean not null default false.
- sort_order int not null.

MVP nodes:

- day_1 through day_7.
- week_2.
- week_3.
- week_4.

Access:

- Static content can be read by authenticated users, but locked body content should be gated by app logic.
- If exposing static content directly to clients, keep locked body content separate or enforce unlock filtering through a server route/RPC.

### task_definitions

Purpose:

- Stores static task definitions attached to care plan nodes and profile conditions.

Columns:

- id text primary key.
- node_id text references care_plan_nodes(id).
- title text not null.
- description text.
- trigger_type text not null.
- due_day int.
- is_paid_feature boolean not null default false.
- milestone_key text.

Trigger examples:

- always.
- pet_type_cat.
- pet_type_dog.
- health_records_not_sure.
- concern_not_eating_or_drinking.

### pet_tasks

Purpose:

- Stores generated or materialized task state for a user's pet.

Columns:

- id uuid primary key.
- user_id uuid not null references auth.users(id).
- pet_profile_id uuid not null references pet_profiles(id) on delete cascade.
- task_definition_id text not null references task_definitions(id).
- due_date date not null.
- status text not null default 'not_done'.
- done_at timestamptz.
- is_active boolean not null default true.
- created_at timestamptz not null default now().

Task reconciliation:

- Profile creation and profile update materialize all eligible task definitions.
- Upsert preserves `status` and `done_at` for existing rows.
- No-longer-eligible rows become `is_active = false`, so Home, Plan, and Milestone derivation exclude them without deleting history.

### pet_check_ins

Purpose: one low-friction daily status per pet profile.

- user_id and pet_profile_id owned by the authenticated user.
- check_in_date date not null.
- status in `better`, `same`, `worse`.
- Unique `(pet_profile_id, check_in_date)`; same-day submit is an upsert.

No free text is stored.

### product_events

Purpose: private server-side funnel events; an insert failure must not block product behavior.

Event names: onboarding_viewed, profile_created, home_viewed, concern_opened, task_completed, check_in_submitted, paywall_viewed, checkout_started, purchase_completed, refund_created.

RLS is enabled with no client policy. Server-side service-role code writes the rows.

Suggested constraints:

- status in `not_done`, `done`.
- Unique `(pet_profile_id, task_definition_id)`.

Derived UI state:

- Upcoming: due_date is today or future and status is not_done.
- Overdue: due_date is before today and status is not_done.
- Done: done_at is not null.

Do not store notes, photos, or attachments in MVP.

### concern_guidance

Purpose:

- Stores static guidance for each concern.

Columns:

- id text primary key.
- concern_key text not null.
- pet_type text.
- priority_rank int not null.
- common_settling_in text not null.
- ask_a_vet text not null.
- seek_urgent_care text not null.
- priority_reason text not null.
- source_notes text.

Rules:

- pet_type null means shared guidance.
- pet_type cat/dog overrides shared guidance only where necessary.
- Lower priority_rank means higher display priority.

Safety:

- Wording must avoid diagnosis.
- Use "may", "consider contacting a vet", "seek urgent care if", and "not medical advice".

### concern_actions

Purpose:

- Records that a user opened guidance and selected a next step.

Columns:

- id uuid primary key.
- user_id uuid not null references auth.users(id).
- pet_profile_id uuid not null references pet_profiles(id) on delete cascade.
- concern_key text not null.
- action text not null.
- created_at timestamptz not null default now().

Suggested action values:

- observe.
- ask_a_vet.
- seek_urgent_care.

Used for:

- Unlocking Concern Handled Thoughtfully.
- Understanding concern detail engagement.

### milestone_definitions

Purpose:

- Stores static Milestone definitions.

Columns:

- id text primary key.
- title text not null.
- value_copy text not null.
- locked_hint text not null.
- trigger_type text not null.
- sort_order int not null.
- is_paid_visible boolean not null default false.

MVP IDs:

- first_day_together.
- safe_space_set_up.
- first_meal_check.
- vet_visit_planned.
- records_checked.
- settling_in_week_complete.
- concern_handled_thoughtfully.
- routine_taking_shape.
- first_month_complete.

### pet_milestones

Purpose:

- Stores unlocked Milestones for the pet.

Columns:

- id uuid primary key.
- user_id uuid not null references auth.users(id).
- pet_profile_id uuid not null references pet_profiles(id) on delete cascade.
- milestone_id text not null references milestone_definitions(id).
- unlocked_at timestamptz not null default now().
- trigger_task_id uuid references pet_tasks(id).
- trigger_concern_action_id uuid references concern_actions(id).

Suggested constraint:

- Unique `(pet_profile_id, milestone_id)`.

### purchases

Purpose:

- Stores one-time purchase state for one pet profile.

Columns:

- id uuid primary key.
- user_id uuid not null references auth.users(id).
- pet_profile_id uuid not null references pet_profiles(id) on delete cascade.
- creem_customer_id text.
- creem_checkout_id text unique.
- creem_order_id text.
- amount_cents int not null default 999.
- currency text not null default 'usd'.
- status text not null.
- purchased_at timestamptz.
- refunded_at timestamptz.
- created_at timestamptz not null default now().
- updated_at timestamptz not null default now().

Suggested status values:

- pending.
- paid.
- refunded.
- failed.
- canceled.

Unlock rule:

- Paid access is true only when a purchase exists for the pet_profile_id with status `paid`.

Refund rule:

- If refund is granted, set status to `refunded` and remove paid access.

### creem_events

Purpose:

- Stores processed Creem webhook events for idempotency and audit.

Columns:

- id text primary key.
- event_type text not null.
- received_at timestamptz not null default now().
- processed_at timestamptz.
- processing_error text.

Invariant:

- Each Creem event ID is processed at most once.

## Access Control And RLS

Enable RLS on all user-owned tables in the public schema.

User-owned tables:

- pet_profiles.
- pet_concerns.
- pet_tasks.
- concern_actions.
- pet_milestones.
- purchases.

RLS pattern:

- Select own rows only.
- Insert rows only with `user_id = auth.uid()`.
- Update own rows only.
- Delete own rows only where deletion is required by product behavior.

Use `TO authenticated` plus ownership predicates. Do not rely on `TO authenticated` alone.

Example policy shape:

```sql
create policy "Users can read own pet profiles"
on public.pet_profiles
for select
to authenticated
using ((select auth.uid()) = user_id);
```

For update policies, include both `USING` and `WITH CHECK`.

Static content tables:

- care_plan_nodes.
- task_definitions.
- concern_guidance.
- milestone_definitions.

Options:

- Keep static content public-readable to authenticated users and enforce paid gating in app/server logic.
- Or split preview metadata from paid body content to prevent clients from reading locked content directly.

Recommended MVP:

- Split locked paid body content behind a server route/RPC if using client-side Supabase access.
- Do not expose paid timeline body content directly through unrestricted client queries.

## Creem Checkout Flow

Use Creem-hosted Checkout.

Checkout product:

- A one-time $9.99 Creem product.

Create Checkout Session server-side:

- Verify authenticated Supabase user.
- Verify pet_profile belongs to user.
- Verify pet_profile does not already have a paid purchase.
- Create local purchase row with status `pending`.
- Create Creem Checkout Session with metadata:
  - user_id.
  - pet_profile_id.
  - purchase_id.
- Set success URL to Checkout Return route. Creem appends `checkout_id` after payment.

Client receives only the Creem Checkout URL.

## Webhook Fulfillment

Required webhook:

- `checkout.completed`.

Recommended additional events:

- `refund.created`.

Webhook handling:

1. Verify the Creem HMAC-SHA256 signature with webhook signing secret.
2. Store Creem event ID in `creem_events`.
3. If event ID already exists and processed, return success.
4. For `checkout.completed`, retrieve checkout data.
5. Read metadata purchase_id, user_id, and pet_profile_id.
6. Confirm order status is paid before unlocking.
7. Update purchase row:
   - status = paid.
   - purchased_at = now().
   - creem_customer_id.
   - creem_checkout_id.
   - creem_order_id.
8. Mark event processed.

Webhook must be idempotent. A repeated event must not create duplicate paid rows or duplicate unlock side effects.

## Checkout Return Logic

Checkout Return route behavior:

1. Read `session_id` from URL.
2. Ask backend for current purchase state.
3. If purchase is paid, redirect to Home with unlocked state.
4. If purchase is pending, show Processing and poll briefly or provide refresh.
5. If purchase is canceled or failed, show retry path.

Do not grant unlock from the return URL alone. The return URL is only a navigation event. The webhook or server-side fulfillment check must update local purchase state.

## Unlock Logic

Function:

- `has_paid_access(pet_profile_id, user_id)`.

Returns true when:

- pet_profile belongs to user.
- A purchase exists for the pet profile.
- purchase.status = paid.

Free access:

- Day 1 body content.
- Basic selected concern guidance.
- Day 1 Milestone.
- Future node titles and dates.

Paid access:

- All 30-day body content.
- Personalized care steps.
- Upcoming / overdue reminders.
- Full concern detail pages.
- Full Milestones progression.

## Milestone Unlock Logic

First Day Together:

- Unlock after profile creation and Day 1 view or Day 1 task completion.

Safe Space Set Up:

- Unlock when the quiet-space task is completed.

First Meal Check:

- Unlock when eating/drinking check task is completed.

Vet Visit Planned:

- Unlock when first vet check task is completed.

Records Checked:

- Unlock when health/vaccine records review task is completed.

Settling-In Week Complete:

- Unlock at Day 7 if at least 3 key first-week tasks are completed.

Concern Handled Thoughtfully:

- Unlock when a user opens a concern detail page and selects observe, ask a vet, or seek urgent care.

Routine Taking Shape:

- Unlock when any Week 2 or Week 3 key task is completed.

First Month Complete:

- Unlock at Day 30 or after completing the final timeline node.

Milestone insertion should be idempotent using unique `(pet_profile_id, milestone_id)`.

## Minimal API Surface

Recommended server endpoints or actions:

- Create pet profile.
- Update pet profile.
- Update selected concerns.
- Mark task done.
- Create Creem Checkout Session.
- Creem webhook.
- Read checkout status.
- Read unlocked Home data.
- Read Plan data with paid gating.
- Read Profile and Milestones.

Avoid adding admin, organization, or multi-pet APIs in MVP.

## Privacy And Safety

Do not store:

- Medical images.
- Vaccine card photos.
- Vet records.
- Doctor notes.

Do store:

- User-selected concern keys.
- Guidance viewed.
- Next-step action selected.

Product copy must state:

- Guidance is educational.
- It is not medical advice.
- Users should contact a veterinarian for health concerns.
- Users should seek urgent care for severe symptoms.

## Open Implementation Decisions

Decide before coding:

- Whether static paid content lives in database tables, local content files, or server-side constants.
- Whether timeline tasks are generated once at profile creation or derived dynamically from definitions.
- Exact framework for the web app.
- Exact hosting/runtime for Creem webhook.
- Whether refunds are processed manually in Creem Dashboard or through an in-app support flow.

## Acceptance Criteria

- RLS is enabled for every user-owned table.
- Users can only read and mutate their own pet data.
- Free users cannot access paid timeline body content through client queries.
- Creem API key and Supabase service role key are server-only.
- `checkout.completed` can mark a purchase paid exactly once.
- Checkout Return never unlocks access by URL alone.
- Paid access is bound to one pet_profile_id.
- Refunded purchases no longer grant paid access.
- Task completion can trigger Milestones without duplicate unlock rows.
- Data model does not include medical attachments in MVP.
