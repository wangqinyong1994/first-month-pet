do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'purchases' and column_name = 'stripe_customer_id'
  ) then
    alter table public.purchases rename column stripe_customer_id to creem_customer_id;
    alter table public.purchases rename column stripe_checkout_session_id to creem_checkout_id;
    alter table public.purchases rename column stripe_payment_intent_id to creem_order_id;
  end if;

  if to_regclass('public.stripe_events') is not null and to_regclass('public.creem_events') is null then
    alter table public.stripe_events rename to creem_events;
  end if;
end;
$$;
