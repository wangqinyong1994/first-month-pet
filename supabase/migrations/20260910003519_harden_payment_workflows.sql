alter table public.purchases
  add column if not exists creem_checkout_url text,
  add column if not exists checkout_claimed_at timestamptz,
  add column if not exists checkout_claim_token uuid;

alter table public.creem_events
  add column if not exists processing_at timestamptz,
  add column if not exists order_reference text,
  add column if not exists event_payload jsonb;

create unique index if not exists purchases_one_pending_per_pet
on public.purchases (pet_profile_id)
where status = 'pending';

create or replace function public.acquire_pending_purchase(
  p_user_id uuid,
  p_pet_profile_id uuid,
  p_claim_token uuid
)
returns table (id uuid, creem_checkout_id text, creem_checkout_url text, checkout_claimed boolean, checkout_claimed_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  purchase public.purchases%rowtype;
begin
  perform 1
  from public.pet_profiles
  where id = p_pet_profile_id and user_id = p_user_id
  for update;
  if not found then
    raise exception 'Pet profile not found';
  end if;

  select * into purchase
  from public.purchases
  where purchase.user_id = p_user_id
    and purchase.pet_profile_id = p_pet_profile_id
    and purchase.status = 'pending'
  order by purchase.created_at
  limit 1
  for update;
  if found then
    if purchase.creem_checkout_url is null
      and (purchase.checkout_claimed_at is null or purchase.checkout_claimed_at < now() - interval '10 minutes') then
      update public.purchases
      set checkout_claimed_at = now(), checkout_claim_token = p_claim_token
      where purchases.id = purchase.id
      returning * into purchase;
      return query select purchase.id, purchase.creem_checkout_id, purchase.creem_checkout_url, true, purchase.checkout_claimed_at;
      return;
    end if;
    return query select purchase.id, purchase.creem_checkout_id, purchase.creem_checkout_url, false, purchase.checkout_claimed_at;
    return;
  end if;

  insert into public.purchases (user_id, pet_profile_id, status, checkout_claimed_at, checkout_claim_token)
  values (p_user_id, p_pet_profile_id, 'pending', now(), p_claim_token)
  returning * into purchase;
  return query select purchase.id, purchase.creem_checkout_id, purchase.creem_checkout_url, true, purchase.checkout_claimed_at;
end;
$$;

create or replace function public.claim_creem_event(
  p_event_id text,
  p_event_type text,
  p_order_reference text,
  p_event_payload jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  existing_event public.creem_events%rowtype;
  inserted_event boolean := false;
begin
  insert into public.creem_events (id, event_type, processing_at, order_reference, event_payload)
  values (p_event_id, p_event_type, now(), p_order_reference, p_event_payload)
  on conflict (id) do nothing
  returning true into inserted_event;

  if inserted_event then
    return true;
  end if;

  select * into existing_event
  from public.creem_events
  where id = p_event_id
  for update;

  if existing_event.event_type <> p_event_type then
    raise exception 'Creem event type mismatch';
  end if;

  update public.creem_events
  set order_reference = coalesce(p_order_reference, order_reference),
      event_payload = coalesce(p_event_payload, event_payload)
  where id = p_event_id;

  if existing_event.processed_at is not null
    or (existing_event.processing_at is not null and existing_event.processing_at >= now() - interval '10 minutes') then
    return false;
  end if;

  update public.creem_events
  set processing_at = now(), processing_error = null
  where id = p_event_id;
  return true;
end;
$$;

create or replace function public.complete_creem_event(p_event_id text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.creem_events
  set processed_at = now(), processing_at = null, processing_error = null
  where id = p_event_id and processed_at is null;
  return found;
end;
$$;

create or replace function public.release_creem_event(p_event_id text, p_error text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.creem_events
  set processing_at = null, processing_error = left(p_error, 1000)
  where id = p_event_id and processed_at is null;
  return found;
end;
$$;

create or replace function public.sync_pet_profile(
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
  if p_adoption_date > current_date then
    raise exception 'Adoption date must be today or earlier';
  end if;

  if exists (
    select 1 from unnest(coalesce(p_concern_keys, array[]::text[])) selected(concern_key)
    where selected.concern_key not in (
      'not_eating_or_drinking', 'diarrhea_or_unusual_stool', 'vomiting', 'hiding_or_fearful',
      'coughing_sneezing_or_nasal_discharge', 'low_energy_or_weakness',
      'scratching_fleas_or_skin_issue', 'litter_box_or_potty_accidents', 'no_concern_right_now'
    )
  ) then
    raise exception 'Unknown concern key';
  end if;
  if array_position(p_concern_keys, 'no_concern_right_now') is not null
    and coalesce(array_length(p_concern_keys, 1), 0) > 1 then
    raise exception 'no_concern_right_now must be exclusive';
  end if;

  if p_profile_id is null then
    insert into public.pet_profiles (user_id, pet_type, name, adoption_date, estimated_age_stage, health_records_status, adoption_source, arrival_group_size, has_resident_pets)
    values (current_user_id, p_pet_type, p_name, p_adoption_date, p_estimated_age_stage, p_health_records_status, p_adoption_source, p_arrival_group_size, p_has_resident_pets)
    returning id into profile_id;
  else
    update public.pet_profiles
    set pet_type = p_pet_type, name = p_name, adoption_date = p_adoption_date,
      estimated_age_stage = p_estimated_age_stage, health_records_status = p_health_records_status,
      adoption_source = p_adoption_source, arrival_group_size = p_arrival_group_size,
      has_resident_pets = p_has_resident_pets
    where id = p_profile_id and user_id = current_user_id
    returning id into profile_id;
    if profile_id is null then raise exception 'Pet profile not found'; end if;
  end if;

  update public.pet_concerns set cleared_at = now()
  where pet_profile_id = profile_id and user_id = current_user_id and cleared_at is null;
  insert into public.pet_concerns (user_id, pet_profile_id, concern_key)
  select current_user_id, profile_id, concern_key
  from (select distinct value as concern_key from unnest(coalesce(p_concern_keys, array[]::text[])) value) selected_concerns;

  insert into public.pet_tasks (user_id, pet_profile_id, task_definition_id, due_date, is_active)
  select current_user_id, profile_id, definition.id, p_adoption_date + coalesce(definition.due_day, 1) - 1, true
  from public.task_definitions definition
  where definition.trigger_type = 'always'
    or definition.trigger_type = 'pet_type_' || p_pet_type
    or definition.trigger_type = 'health_records_' || p_health_records_status
    or (definition.trigger_type = 'arrival_group_multiple' and p_arrival_group_size <> 'one')
    or (definition.trigger_type = 'resident_pets_yes' and p_has_resident_pets)
    or (definition.trigger_type like 'concern_%' and substring(definition.trigger_type from 9) = any(coalesce(p_concern_keys, array[]::text[])))
  on conflict (pet_profile_id, task_definition_id) do update set due_date = excluded.due_date, is_active = true;

  update public.pet_tasks set is_active = false
  where pet_profile_id = profile_id and user_id = current_user_id
    and not exists (
      select 1 from public.task_definitions definition
      where definition.id = pet_tasks.task_definition_id and (
        definition.trigger_type = 'always'
        or definition.trigger_type = 'pet_type_' || p_pet_type
        or definition.trigger_type = 'health_records_' || p_health_records_status
        or (definition.trigger_type = 'arrival_group_multiple' and p_arrival_group_size <> 'one')
        or (definition.trigger_type = 'resident_pets_yes' and p_has_resident_pets)
        or (definition.trigger_type like 'concern_%' and substring(definition.trigger_type from 9) = any(coalesce(p_concern_keys, array[]::text[])))
      )
    );
  return profile_id;
end;
$$;

revoke execute on function public.acquire_pending_purchase(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.claim_creem_event(text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.complete_creem_event(text) from public, anon, authenticated;
revoke execute on function public.release_creem_event(text, text) from public, anon, authenticated;
grant execute on function public.acquire_pending_purchase(uuid, uuid, uuid) to service_role;
grant execute on function public.claim_creem_event(text, text, text, jsonb) to service_role;
grant execute on function public.complete_creem_event(text) to service_role;
grant execute on function public.release_creem_event(text, text) to service_role;
