alter table public.pet_profiles
  add column if not exists arrival_group_size text not null default 'one'
    check (arrival_group_size in ('one', 'two', 'three_plus')),
  add column if not exists has_resident_pets boolean not null default false;

alter table public.pet_tasks
  add column if not exists is_active boolean not null default true;

create index if not exists pet_tasks_active_profile_due_date
on public.pet_tasks (pet_profile_id, due_date)
where is_active;

create table public.pet_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_profile_id uuid not null references public.pet_profiles(id) on delete cascade,
  check_in_date date not null default current_date,
  status text not null check (status in ('better', 'same', 'worse')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pet_profile_id, check_in_date)
);

create trigger pet_check_ins_touch_updated_at
before update on public.pet_check_ins
for each row execute function public.touch_updated_at();

alter table public.pet_check_ins enable row level security;

create policy "Users can read own check-ins"
on public.pet_check_ins for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create own check-ins"
on public.pet_check_ins for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own check-ins"
on public.pet_check_ins for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create table public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_profile_id uuid references public.pet_profiles(id) on delete cascade,
  event_name text not null check (event_name in (
    'onboarding_viewed',
    'profile_created',
    'home_viewed',
    'concern_opened',
    'task_completed',
    'check_in_submitted',
    'paywall_viewed',
    'checkout_started',
    'purchase_completed',
    'refund_created'
  )),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index product_events_event_time
on public.product_events (event_name, occurred_at);

create index product_events_profile_time
on public.product_events (pet_profile_id, occurred_at);

alter table public.product_events enable row level security;

insert into public.task_definitions
  (id, node_id, title, description, trigger_type, due_day, is_paid_feature, milestone_key)
values
  ('multiple_arrivals_resources', 'day_1', 'Set up separate resources', 'Give each new pet separate food, water, rest, and toilet access while you observe how they settle.', 'arrival_group_multiple', 1, false, null),
  ('resident_pet_introduction', 'day_1', 'Start introductions slowly', 'Keep new and resident pets separate at first, exchange scents, and use short supervised introductions.', 'resident_pets_yes', 1, false, null)
on conflict (id) do update set
  node_id = excluded.node_id,
  title = excluded.title,
  description = excluded.description,
  trigger_type = excluded.trigger_type,
  due_day = excluded.due_day,
  is_paid_feature = excluded.is_paid_feature,
  milestone_key = excluded.milestone_key;
