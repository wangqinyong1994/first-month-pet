insert into public.care_plan_nodes
  (id, node_type, day_start, day_end, title, common_signs, what_to_do, when_to_seek_help, free_preview, sort_order)
values
  ('day_1', 'day', 1, 1, 'Day 1: Settle in quietly', 'Many newly adopted pets may hide, sleep more, eat less, or watch from a distance on the first day.', 'Set up food, water, a quiet resting area, and one simple potty or litter routine. Keep introductions brief.', 'Seek urgent care if breathing looks difficult, repeated vomiting occurs, collapse happens, or your pet cannot keep water down.', true, 1),
  ('day_2', 'day', 2, 2, 'Day 2: Keep routines simple', 'Your pet may still be cautious while learning sounds, smells, and household patterns.', 'Repeat the same feeding and potty times. Make a short list of appetite, drinking, stool, and energy observations.', 'Consider contacting a vet if appetite, drinking, stool, or energy worries continue or worsen.', false, 2),
  ('day_3', 'day', 3, 3, 'Day 3: Watch eating and drinking', 'Some pets may begin exploring more; others may need a slower settling-in pace.', 'Check that food and water are easy to reach and that bowls, litter, or potty areas are not crowded.', 'Seek urgent care if your pet shows weakness, repeated vomiting, severe diarrhea, or signs of dehydration.', false, 3),
  ('day_4', 'day', 4, 4, 'Day 4: Plan the first vet check', 'Small changes in confidence may appear as your pet learns the home rhythm.', 'Book or confirm a first vet visit and gather any shelter, breeder, or rescue records.', 'Consider contacting a vet sooner if coughing, sneezing, discharge, scratching, or appetite concerns are present.', false, 4),
  ('day_5', 'day', 5, 5, 'Day 5: Review records', 'Behavior may still vary during the first week.', 'Review vaccine, parasite prevention, deworming, and microchip information if available.', 'Ask a vet if records are missing, unclear, or if your pet came from an unknown background.', false, 5),
  ('day_6', 'day', 6, 6, 'Day 6: Build gentle confidence', 'Your pet may test boundaries or seek more contact as stress lowers.', 'Use short, positive sessions for handling, carrier practice, leash basics, or litter and potty routines.', 'Pause and consider professional help if fear, coughing, vomiting, diarrhea, or weakness is increasing.', false, 6),
  ('day_7', 'day', 7, 7, 'Day 7: First-week review', 'Patterns around appetite, stool, sleep, and confidence may be easier to notice after a week.', 'Review the week and note what improved, what stayed concerning, and what to ask at the vet visit.', 'Consider contacting a vet for concerns that lasted through the week or became more intense.', false, 7),
  ('week_2', 'week', 8, 14, 'Week 2: Shape routines', 'Many pets may show more personality while still needing predictable routines.', 'Keep feeding, potty, rest, and play patterns steady. Add one new experience at a time.', 'Seek urgent care for breathing difficulty, collapse, repeated vomiting, blood in stool, or severe weakness.', false, 8),
  ('week_3', 'week', 15, 21, 'Week 3: Expand gently', 'Confidence may grow, but setbacks can happen after busy days.', 'Practice short outings, handling, grooming, and calm alone-time in small steps.', 'Ask a vet or qualified professional if fear, house-soiling, scratching, coughing, or low energy continues.', false, 9),
  ('week_4', 'week', 22, 30, 'Week 4: First-month review', 'By the end of the month, many routines may be easier to evaluate.', 'Review care routines, vet follow-ups, records, food, parasite prevention, and next-month reminders.', 'Contact a vet for unresolved health concerns or any severe symptom listed in the guidance.', false, 10)
on conflict (id) do update set
  title = excluded.title,
  common_signs = excluded.common_signs,
  what_to_do = excluded.what_to_do,
  when_to_seek_help = excluded.when_to_seek_help,
  free_preview = excluded.free_preview,
  sort_order = excluded.sort_order;

insert into public.task_definitions
  (id, node_id, title, description, trigger_type, due_day, is_paid_feature, milestone_key)
values
  ('set_up_quiet_space', 'day_1', 'Set up a quiet space', 'Give your pet a calm place with water, bedding, and easy exit options.', 'always', 1, false, 'safe_space_set_up'),
  ('first_meal_check', 'day_1', 'Check first meal and water', 'Notice whether your pet eats, drinks, and can access bowls comfortably.', 'always', 1, false, 'first_meal_check'),
  ('plan_vet_visit', 'day_4', 'Plan a first vet check', 'Book or confirm an appointment for a first-month health review.', 'always', 4, true, 'vet_visit_planned'),
  ('review_records_available', 'day_5', 'Review available records', 'Look for vaccine, deworming, parasite prevention, and microchip details.', 'health_records_yes', 5, true, 'records_checked'),
  ('review_records', 'day_5', 'Review health records', 'Look for vaccine, deworming, parasite prevention, and microchip details.', 'health_records_not_sure', 5, true, 'records_checked'),
  ('review_records_missing', 'day_5', 'List missing records', 'Write down record gaps to discuss with a veterinarian or adoption source.', 'health_records_no', 5, true, 'records_checked'),
  ('cat_appetite_watch', 'day_2', 'Watch cat appetite closely', 'Cats may need quicker veterinary input when appetite is very low.', 'pet_type_cat', 2, true, null),
  ('dog_potty_routine', 'day_2', 'Keep dog potty timing steady', 'Use predictable potty trips and calm praise after outdoor success.', 'pet_type_dog', 2, true, null),
  ('not_eating_followup', 'day_2', 'Track eating and drinking concern', 'Record food and water observations to support a vet conversation if needed.', 'concern_not_eating_or_drinking', 2, true, null),
  ('stool_followup', 'day_3', 'Track stool concern', 'Watch stool frequency, water intake, and energy without adding attachments.', 'concern_diarrhea_or_unusual_stool', 3, true, null),
  ('week_two_routine', 'week_2', 'Set a steady daily routine', 'Choose consistent feeding, rest, play, and potty or litter times.', 'always', 10, true, null),
  ('week_three_handling', 'week_3', 'Practice gentle handling', 'Use short calm sessions for paws, ears, carrier, leash, or grooming.', 'always', 17, true, null),
  ('month_review', 'week_4', 'Complete first-month review', 'Review what changed and what needs follow-up before the next month.', 'always', 30, true, null)
on conflict (id) do update set
  node_id = excluded.node_id,
  title = excluded.title,
  description = excluded.description,
  trigger_type = excluded.trigger_type,
  due_day = excluded.due_day,
  is_paid_feature = excluded.is_paid_feature,
  milestone_key = excluded.milestone_key;

insert into public.concern_guidance
  (id, concern_key, pet_type, priority_rank, common_settling_in, ask_a_vet, seek_urgent_care, priority_reason, source_notes)
values
  ('not_eating_or_drinking_shared', 'not_eating_or_drinking', null, 1, 'A newly adopted pet may eat less at first, but drinking and energy still matter.', 'Consider contacting a vet if appetite stays very low, drinking drops, or you are unsure what your pet ate before adoption.', 'Seek urgent care if your pet cannot keep water down, seems very weak, or shows signs of dehydration.', 'Food and water changes can become important quickly, especially when paired with low energy.', 'Based on broad veterinary welfare guidance; not medical advice.'),
  ('not_eating_or_drinking_cat', 'not_eating_or_drinking', 'cat', 1, 'A cat may hide and delay meals after adoption, but extended appetite loss needs attention.', 'Consider contacting a vet promptly if a cat eats little or nothing for a full day.', 'Seek urgent care if appetite loss appears with weakness, repeated vomiting, breathing difficulty, or collapse.', 'Cats can be more sensitive to extended appetite loss than many dogs.', 'Based on broad veterinary welfare guidance; not medical advice.'),
  ('vomiting_shared', 'vomiting', null, 2, 'Stress, food changes, or eating too fast may be involved, but repeated vomiting needs attention.', 'Consider contacting a vet if vomiting repeats, appetite drops, or diarrhea also appears.', 'Seek urgent care if vomiting is repeated, contains blood, follows toxin exposure, or your pet seems weak.', 'Vomiting can become urgent when repeated or paired with weakness or dehydration.', 'Based on broad veterinary welfare guidance; not medical advice.'),
  ('low_energy_shared', 'low_energy_or_weakness', null, 3, 'A newly adopted pet may sleep more, but marked weakness should not be ignored.', 'Consider contacting a vet if low energy persists, appetite changes, or your pet avoids usual movement.', 'Seek urgent care if your pet collapses, cannot stand, has trouble breathing, or seems severely weak.', 'Weakness can signal a concern that should be assessed sooner.', 'Based on broad veterinary welfare guidance; not medical advice.'),
  ('diarrhea_shared', 'diarrhea_or_unusual_stool', null, 4, 'Food changes and stress may affect stool during settling-in.', 'Consider contacting a vet if diarrhea continues, appetite changes, or your pet is young, senior, or fragile.', 'Seek urgent care if stool contains blood, diarrhea is severe, or weakness and dehydration signs appear.', 'Stool changes are common to monitor, but severity and hydration change the priority.', 'Based on broad veterinary welfare guidance; not medical advice.'),
  ('coughing_shared', 'coughing_sneezing_or_nasal_discharge', null, 5, 'Mild sneezing or discharge may appear after a new environment or shelter exposure.', 'Consider contacting a vet if coughing, sneezing, discharge, or appetite changes continue.', 'Seek urgent care if breathing looks difficult, gums look pale or blue, or your pet is very weak.', 'Breathing-related symptoms become higher priority when effort or weakness appears.', 'Based on broad veterinary welfare guidance; not medical advice.'),
  ('hiding_shared', 'hiding_or_fearful', null, 6, 'Hiding or fear may happen while a pet learns the home and people.', 'Consider contacting a vet or qualified behavior professional if fear prevents eating, drinking, or toileting.', 'Seek urgent care if hiding appears with collapse, breathing difficulty, repeated vomiting, or severe weakness.', 'Fear is often managed with time and calm routines, but health signs change the priority.', 'Based on broad veterinary welfare guidance; not medical advice.'),
  ('scratching_shared', 'scratching_fleas_or_skin_issue', null, 7, 'Scratching may relate to fleas, skin irritation, stress, or grooming changes.', 'Consider contacting a vet if scratching is intense, skin is broken, hair loss appears, or fleas are present.', 'Seek urgent care if swelling of the face, breathing trouble, or severe sudden reaction appears.', 'Skin concerns are usually less urgent unless severe reaction signs appear.', 'Based on broad veterinary welfare guidance; not medical advice.'),
  ('potty_shared', 'litter_box_or_potty_accidents', null, 8, 'Accidents may happen while a pet learns routines, location, and household access.', 'Consider contacting a vet if accidents are frequent, painful, bloody, or paired with appetite or energy changes.', 'Seek urgent care if your pet strains without producing urine, cries in pain, or seems very weak.', 'Urination difficulty can be urgent, while routine accidents may need patient adjustment.', 'Based on broad veterinary welfare guidance; not medical advice.')
on conflict (id) do update set
  priority_rank = excluded.priority_rank,
  common_settling_in = excluded.common_settling_in,
  ask_a_vet = excluded.ask_a_vet,
  seek_urgent_care = excluded.seek_urgent_care,
  priority_reason = excluded.priority_reason,
  source_notes = excluded.source_notes;

insert into public.milestone_definitions
  (id, title, value_copy, locked_hint, trigger_type, sort_order, is_paid_visible)
values
  ('first_day_together', 'First Day Together', 'You created a simple first-day plan for your pet.', 'Start with Day 1.', 'profile_created', 1, false),
  ('safe_space_set_up', 'Safe Space Set Up', 'A quiet space helps many newly adopted pets feel calmer while they settle in.', 'Set up a quiet place when ready.', 'task', 2, false),
  ('first_meal_check', 'First Meal Check', 'Checking food and water helps you notice early changes.', 'Check the first meal and water access.', 'task', 3, false),
  ('vet_visit_planned', 'Vet Visit Planned', 'Planning a vet check helps turn uncertainty into a clear next step.', 'Plan your first vet check when ready.', 'task', 4, true),
  ('records_checked', 'Records Checked', 'Reviewing records helps you spot vaccine or parasite-prevention questions.', 'Review available records when ready.', 'task', 5, true),
  ('settling_in_week_complete', 'Settling-In Week Complete', 'You followed several first-week care steps and have better observations.', 'Keep following your first-week plan.', 'derived', 6, true),
  ('concern_handled_thoughtfully', 'Concern Handled Thoughtfully', 'Choosing a next step helps you respond with care instead of guessing.', 'Open a concern and choose a next step.', 'concern_action', 7, true),
  ('routine_taking_shape', 'Routine Taking Shape', 'A steady routine can help your pet understand what to expect.', 'Continue through your 30-day care plan.', 'derived', 8, true),
  ('first_month_complete', 'First Month Complete', 'You completed the first-month review and can plan longer-term care.', 'Continue through your 30-day care plan.', 'derived', 9, true)
on conflict (id) do update set
  title = excluded.title,
  value_copy = excluded.value_copy,
  locked_hint = excluded.locked_hint,
  trigger_type = excluded.trigger_type,
  sort_order = excluded.sort_order,
  is_paid_visible = excluded.is_paid_visible;
