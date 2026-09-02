create extension if not exists pgcrypto;

create table public.pet_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_type text not null check (pet_type in ('cat', 'dog')),
  name text not null check (length(trim(name)) > 0),
  adoption_date date not null,
  estimated_age_stage text not null check (estimated_age_stage in ('kitten_puppy', 'adult', 'senior', 'unknown')),
  health_records_status text not null check (health_records_status in ('yes', 'no', 'not_sure')),
  adoption_source text not null check (adoption_source in ('shelter', 'breeder', 'friend', 'stray', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table public.pet_concerns (
  id uuid primary key default gen_random_uuid(),
  pet_profile_id uuid not null references public.pet_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  concern_key text not null check (concern_key in (
    'not_eating_or_drinking',
    'diarrhea_or_unusual_stool',
    'vomiting',
    'hiding_or_fearful',
    'coughing_sneezing_or_nasal_discharge',
    'low_energy_or_weakness',
    'scratching_fleas_or_skin_issue',
    'litter_box_or_potty_accidents',
    'no_concern_right_now'
  )),
  selected_at timestamptz not null default now(),
  cleared_at timestamptz
);

create unique index pet_concerns_one_active_key
on public.pet_concerns (pet_profile_id, concern_key)
where cleared_at is null;

create table public.care_plan_nodes (
  id text primary key,
  node_type text not null check (node_type in ('day', 'week')),
  day_start int not null check (day_start between 1 and 30),
  day_end int not null check (day_end between 1 and 30),
  title text not null,
  common_signs text not null,
  what_to_do text not null,
  when_to_seek_help text not null,
  free_preview boolean not null default false,
  sort_order int not null,
  check (day_start <= day_end)
);

create table public.task_definitions (
  id text primary key,
  node_id text references public.care_plan_nodes(id),
  title text not null,
  description text,
  trigger_type text not null,
  due_day int check (due_day between 1 and 30),
  is_paid_feature boolean not null default false,
  milestone_key text
);

create table public.pet_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_profile_id uuid not null references public.pet_profiles(id) on delete cascade,
  task_definition_id text not null references public.task_definitions(id),
  due_date date not null,
  status text not null default 'not_done' check (status in ('not_done', 'done')),
  done_at timestamptz,
  created_at timestamptz not null default now(),
  unique (pet_profile_id, task_definition_id)
);

create table public.concern_guidance (
  id text primary key,
  concern_key text not null,
  pet_type text check (pet_type in ('cat', 'dog')),
  priority_rank int not null,
  common_settling_in text not null,
  ask_a_vet text not null,
  seek_urgent_care text not null,
  priority_reason text not null,
  source_notes text
);

create table public.concern_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_profile_id uuid not null references public.pet_profiles(id) on delete cascade,
  concern_key text not null,
  action text not null check (action in ('observe', 'ask_a_vet', 'seek_urgent_care')),
  created_at timestamptz not null default now()
);

create table public.milestone_definitions (
  id text primary key,
  title text not null,
  value_copy text not null,
  locked_hint text not null,
  trigger_type text not null,
  sort_order int not null,
  is_paid_visible boolean not null default false
);

create table public.pet_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_profile_id uuid not null references public.pet_profiles(id) on delete cascade,
  milestone_id text not null references public.milestone_definitions(id),
  unlocked_at timestamptz not null default now(),
  trigger_task_id uuid references public.pet_tasks(id),
  trigger_concern_action_id uuid references public.concern_actions(id),
  unique (pet_profile_id, milestone_id)
);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_profile_id uuid not null references public.pet_profiles(id) on delete cascade,
  creem_customer_id text,
  creem_checkout_id text unique,
  creem_order_id text,
  amount_cents int not null default 999,
  currency text not null default 'usd',
  status text not null check (status in ('pending', 'paid', 'refunded', 'failed', 'canceled')),
  purchased_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.creem_events (
  id text primary key,
  event_type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger pet_profiles_touch_updated_at
before update on public.pet_profiles
for each row execute function public.touch_updated_at();

create trigger purchases_touch_updated_at
before update on public.purchases
for each row execute function public.touch_updated_at();

create or replace function public.enforce_pet_concern_invariants()
returns trigger
language plpgsql
as $$
begin
  if new.cleared_at is null and new.concern_key = 'no_concern_right_now' and exists (
    select 1 from public.pet_concerns
    where pet_profile_id = new.pet_profile_id
      and cleared_at is null
      and concern_key <> 'no_concern_right_now'
      and id <> coalesce(new.id, gen_random_uuid())
  ) then
    raise exception 'no_concern_right_now cannot be active with another concern';
  end if;

  if new.cleared_at is null and new.concern_key <> 'no_concern_right_now' and exists (
    select 1 from public.pet_concerns
    where pet_profile_id = new.pet_profile_id
      and cleared_at is null
      and concern_key = 'no_concern_right_now'
      and id <> coalesce(new.id, gen_random_uuid())
  ) then
    raise exception 'no_concern_right_now cannot be active with another concern';
  end if;

  return new;
end;
$$;

create trigger pet_concerns_enforce_invariants
before insert or update on public.pet_concerns
for each row execute function public.enforce_pet_concern_invariants();

alter table public.pet_profiles enable row level security;
alter table public.pet_concerns enable row level security;
alter table public.care_plan_nodes enable row level security;
alter table public.task_definitions enable row level security;
alter table public.pet_tasks enable row level security;
alter table public.concern_guidance enable row level security;
alter table public.concern_actions enable row level security;
alter table public.milestone_definitions enable row level security;
alter table public.pet_milestones enable row level security;
alter table public.purchases enable row level security;
alter table public.creem_events enable row level security;

create policy "Users can read own pet profiles"
on public.pet_profiles for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create own pet profiles"
on public.pet_profiles for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own pet profiles"
on public.pet_profiles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can read own concerns"
on public.pet_concerns for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create own concerns"
on public.pet_concerns for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own concerns"
on public.pet_concerns for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can read own tasks"
on public.pet_tasks for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can update own tasks"
on public.pet_tasks for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can read own concern actions"
on public.concern_actions for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create own concern actions"
on public.concern_actions for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can read own milestones"
on public.pet_milestones for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read own purchases"
on public.purchases for select to authenticated
using ((select auth.uid()) = user_id);
