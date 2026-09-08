insert into public.task_definitions
  (id, node_id, title, description, trigger_type, due_day, is_paid_feature, milestone_key)
values
  ('review_records_available', 'day_5', 'Review available records', 'Look for vaccine, deworming, parasite prevention, and microchip details.', 'health_records_yes', 5, true, 'records_checked')
on conflict (id) do update set
  node_id = excluded.node_id,
  title = excluded.title,
  description = excluded.description,
  trigger_type = excluded.trigger_type,
  due_day = excluded.due_day,
  is_paid_feature = excluded.is_paid_feature,
  milestone_key = excluded.milestone_key;
