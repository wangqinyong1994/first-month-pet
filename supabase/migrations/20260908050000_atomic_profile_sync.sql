drop function if exists public.sync_pet_profile(uuid, text, text, date, text, text, text, text, boolean, text[], jsonb);

create function public.sync_pet_profile(
  p_profile_id uuid,
  p_pet_type text,
  p_name text,
  p_adoption_date date,
  p_estimated_age_stage text,
  p_health_records_status text,
  p_adoption_source text,
  p_arrival_group_size text,
  p_has_resident_pets boolean,
  p_concern_keys text[]
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  profile_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_concern_keys, array[]::text[])) as selected(concern_key)
    where selected.concern_key not in (
      'not_eating_or_drinking',
      'diarrhea_or_unusual_stool',
      'vomiting',
      'hiding_or_fearful',
      'coughing_sneezing_or_nasal_discharge',
      'low_energy_or_weakness',
      'scratching_fleas_or_skin_issue',
      'litter_box_or_potty_accidents',
      'no_concern_right_now'
    )
  ) then
    raise exception 'Unknown concern key';
  end if;

  if array_position(p_concern_keys, 'no_concern_right_now') is not null
    and coalesce(array_length(p_concern_keys, 1), 0) > 1 then
    raise exception 'no_concern_right_now must be exclusive';
  end if;

  if p_profile_id is null then
    insert into public.pet_profiles (
      user_id,
      pet_type,
      name,
      adoption_date,
      estimated_age_stage,
      health_records_status,
      adoption_source,
      arrival_group_size,
      has_resident_pets
    ) values (
      current_user_id,
      p_pet_type,
      p_name,
      p_adoption_date,
      p_estimated_age_stage,
      p_health_records_status,
      p_adoption_source,
      p_arrival_group_size,
      p_has_resident_pets
    ) returning id into profile_id;
  else
    update public.pet_profiles
    set
      pet_type = p_pet_type,
      name = p_name,
      adoption_date = p_adoption_date,
      estimated_age_stage = p_estimated_age_stage,
      health_records_status = p_health_records_status,
      adoption_source = p_adoption_source,
      arrival_group_size = p_arrival_group_size,
      has_resident_pets = p_has_resident_pets
    where id = p_profile_id and user_id = current_user_id
    returning id into profile_id;

    if profile_id is null then
      raise exception 'Pet profile not found';
    end if;
  end if;

  update public.pet_concerns
  set cleared_at = now()
  where pet_profile_id = profile_id
    and user_id = current_user_id
    and cleared_at is null;

  insert into public.pet_concerns (user_id, pet_profile_id, concern_key)
  select current_user_id, profile_id, concern_key
  from (
    select distinct value as concern_key
    from unnest(coalesce(p_concern_keys, array[]::text[])) as value
  ) selected_concerns;

  insert into public.pet_tasks (user_id, pet_profile_id, task_definition_id, due_date, is_active)
  select current_user_id, profile_id, definition.id,
    p_adoption_date + coalesce(definition.due_day, 1) - 1,
    true
  from public.task_definitions definition
  where definition.trigger_type = 'always'
    or definition.trigger_type = 'pet_type_' || p_pet_type
    or definition.trigger_type = 'health_records_' || p_health_records_status
    or (definition.trigger_type = 'arrival_group_multiple' and p_arrival_group_size <> 'one')
    or (definition.trigger_type = 'resident_pets_yes' and p_has_resident_pets)
    or (
      definition.trigger_type like 'concern_%'
      and substring(definition.trigger_type from 9) = any(coalesce(p_concern_keys, array[]::text[]))
    )
  on conflict (pet_profile_id, task_definition_id) do update
  set due_date = excluded.due_date,
      is_active = true;

  update public.pet_tasks
  set is_active = false
  where pet_profile_id = profile_id
    and user_id = current_user_id
    and not exists (
      select 1
      from public.task_definitions definition
      where definition.id = pet_tasks.task_definition_id
        and (
          definition.trigger_type = 'always'
          or definition.trigger_type = 'pet_type_' || p_pet_type
          or definition.trigger_type = 'health_records_' || p_health_records_status
          or (definition.trigger_type = 'arrival_group_multiple' and p_arrival_group_size <> 'one')
          or (definition.trigger_type = 'resident_pets_yes' and p_has_resident_pets)
          or (
            definition.trigger_type like 'concern_%'
            and substring(definition.trigger_type from 9) = any(coalesce(p_concern_keys, array[]::text[]))
          )
        )
    );

  return profile_id;
end;
$$;

create or replace function public.record_concern_action(
  p_pet_profile_id uuid,
  p_concern_key text,
  p_action text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  profile_pet_type text;
  profile_adoption_date date;
  action_id uuid;
  milestone_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_action not in ('observe', 'ask_a_vet', 'seek_urgent_care') then
    raise exception 'Unknown concern action';
  end if;

  select pet_type, adoption_date
  into profile_pet_type, profile_adoption_date
  from public.pet_profiles
  where id = p_pet_profile_id and user_id = current_user_id;
  if not found then
    raise exception 'Pet profile not found';
  end if;

  if current_date > profile_adoption_date + 29 then
    raise exception 'The first-month plan is read-only';
  end if;

  if not exists (
    select 1 from public.pet_concerns
    where pet_profile_id = p_pet_profile_id
      and user_id = current_user_id
      and concern_key = p_concern_key
      and cleared_at is null
  ) then
    raise exception 'Concern is not active for this profile';
  end if;

  if not exists (
    select 1 from public.concern_guidance
    where concern_key = p_concern_key
      and (pet_type = profile_pet_type or pet_type is null)
  ) then
    raise exception 'Concern guidance not found';
  end if;

  insert into public.concern_actions (user_id, pet_profile_id, concern_key, action)
  values (current_user_id, p_pet_profile_id, p_concern_key, p_action)
  returning id into action_id;

  insert into public.pet_milestones (
    user_id,
    pet_profile_id,
    milestone_id,
    trigger_concern_action_id
  ) values (
    current_user_id,
    p_pet_profile_id,
    'concern_handled_thoughtfully',
    action_id
  )
  on conflict (pet_profile_id, milestone_id) do nothing
  returning id into milestone_id;

  return milestone_id is not null;
end;
$$;

revoke execute on function public.sync_pet_profile(uuid, text, text, date, text, text, text, text, boolean, text[]) from public;
grant execute on function public.sync_pet_profile(uuid, text, text, date, text, text, text, text, boolean, text[]) to authenticated;
revoke execute on function public.sync_pet_profile(uuid, text, text, date, text, text, text, text, boolean, text[]) from anon;
revoke execute on function public.record_concern_action(uuid, text, text) from public;
grant execute on function public.record_concern_action(uuid, text, text) to authenticated;
revoke execute on function public.record_concern_action(uuid, text, text) from anon;

drop policy if exists "Users can create own concerns" on public.pet_concerns;
create policy "Users can create own concerns"
on public.pet_concerns for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.pet_profiles
    where id = pet_profile_id and user_id = (select auth.uid())
  )
);

drop policy if exists "Users can update own concerns" on public.pet_concerns;
create policy "Users can update own concerns"
on public.pet_concerns for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.pet_profiles
    where id = pet_profile_id and user_id = (select auth.uid())
  )
);

drop policy if exists "Users can update own tasks" on public.pet_tasks;
create policy "Users can update own tasks"
on public.pet_tasks for update to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.pet_profiles
    where id = pet_profile_id
      and user_id = (select auth.uid())
      and current_date <= adoption_date + 29
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.pet_profiles
    where id = pet_profile_id
      and user_id = (select auth.uid())
      and current_date <= adoption_date + 29
  )
);

drop policy if exists "Users can create own concern actions" on public.concern_actions;
create policy "Users can create own concern actions"
on public.concern_actions for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.pet_profiles
    where id = pet_profile_id and user_id = (select auth.uid())
  )
  and exists (
    select 1 from public.pet_concerns
    where pet_profile_id = concern_actions.pet_profile_id
      and user_id = (select auth.uid())
      and concern_key = concern_actions.concern_key
      and cleared_at is null
  )
  and exists (
    select 1 from public.pet_profiles
    where id = pet_profile_id
      and user_id = (select auth.uid())
      and current_date <= adoption_date + 29
  )
  and exists (
    select 1 from public.concern_guidance
    where concern_key = concern_actions.concern_key
  )
);

drop policy if exists "Users can create own check-ins" on public.pet_check_ins;
create policy "Users can create own check-ins"
on public.pet_check_ins for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.pet_profiles
    where id = pet_profile_id
      and user_id = (select auth.uid())
      and current_date <= adoption_date + 29
  )
);

drop policy if exists "Users can update own check-ins" on public.pet_check_ins;
create policy "Users can update own check-ins"
on public.pet_check_ins for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.pet_profiles
    where id = pet_profile_id
      and user_id = (select auth.uid())
      and current_date <= adoption_date + 29
  )
);
