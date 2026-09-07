-- Keep publisher metadata as private provenance; it is never selected for public content.
drop policy if exists "Anyone can read reviewed guidance sources" on public.guidance_sources;
revoke all on table public.guidance_sources from anon, authenticated;

update public.concern_guidance
set
  common_settling_in = 'A cat may eat less when a new home feels unfamiliar, especially if they are hiding or their routine has changed. Keep a simple note of meals, water, vomiting, litter-box use, and energy so you can describe the change clearly if you need help.',
  ask_a_vet = 'Contact a veterinarian promptly if your cat eats very little or nothing, drinking changes, or the appetite change comes with vomiting, diarrhea, hiding, or lower energy. A reduced appetite has many possible causes and cannot be explained safely from a home observation alone.',
  seek_urgent_care = 'Seek urgent veterinary care now if your cat cannot keep water down, has trouble breathing, collapses, seems severely weak, or you think they may have eaten something unsafe.'
where id = 'not_eating_or_drinking_cat';

update public.concern_guidance
set
  common_settling_in = 'Coughing, sneezing, or nasal discharge can happen for different reasons and a new environment does not identify the cause. Notice whether the sign is occasional or ongoing, and whether appetite, energy, or breathing look different.',
  ask_a_vet = 'Contact a veterinarian if coughing, sneezing, or discharge persists, worsens, affects eating or resting, or is paired with reduced energy. Describe what you observed rather than trying to identify the illness yourself.',
  seek_urgent_care = 'Seek urgent veterinary care now for labored breathing, open-mouth breathing, blue, gray, or very pale gums, collapse, or severe weakness.'
where id = 'coughing_shared';

update public.concern_guidance
set
  common_settling_in = 'A routine change can lead to accidents, but difficulty passing urine is different from a training issue. Observe whether your pet produces a normal amount of urine and whether they seem comfortable while trying.',
  ask_a_vet = 'Contact a veterinarian promptly for repeated accidents with straining, crying, blood, appetite changes, or lower energy. These signs need an examination to distinguish a routine problem from a health concern.',
  seek_urgent_care = 'Seek urgent veterinary care now if your pet repeatedly tries to urinate but produces little or no urine, appears painful, vomits, collapses, or becomes very weak.'
where id = 'potty_shared';

update public.concern_guidance
set
  common_settling_in = 'Scratching can have several causes. Check calmly for flea dirt, fleas, irritated skin, broken skin, or changes in grooming, and keep bedding and resting areas clean while you arrange appropriate advice.',
  ask_a_vet = 'Contact a veterinarian if scratching is intense, skin is sore or broken, hair loss appears, fleas are found, or your pet seems uncomfortable. Ask which product is appropriate for your pet; a product made for one species may be unsafe for another.',
  seek_urgent_care = 'Seek urgent veterinary care now for facial swelling, breathing trouble, collapse, or a sudden severe reaction.'
where id = 'scratching_shared';

update public.concern_guidance
set
  common_settling_in = 'Vomiting can have many causes, including problems that cannot be sorted out at home. Note when it happened, what came up, any possible access to unsafe items, and whether your cat is eating, drinking, using the litter box, and acting normally.',
  ask_a_vet = 'Contact a veterinarian if vomiting repeats, your cat stops eating or drinking normally, diarrhea appears, or you notice lower energy, weight change, or discomfort. Do not assume a new-home adjustment is the cause.',
  seek_urgent_care = 'Seek urgent veterinary care now for repeated vomiting, blood in vomit, a swollen or painful-looking abdomen, marked weakness, collapse, breathing trouble, or suspected toxin or foreign-object exposure.'
where id = 'vomiting_cat_source';

update public.concern_guidance
set
  common_settling_in = 'Vomiting can have many causes, including problems that cannot be sorted out at home. Note when it happened, what came up, any possible access to unsafe items, and whether your dog is eating, drinking, passing stool, and acting normally.',
  ask_a_vet = 'Contact a veterinarian if vomiting repeats, your dog stops eating or drinking normally, diarrhea appears, or you notice lower energy, weight change, or discomfort. Do not assume a food or routine change is the cause.',
  seek_urgent_care = 'Seek urgent veterinary care now for repeated vomiting, blood in vomit, a swollen or painful-looking abdomen, marked weakness, collapse, breathing trouble, or suspected toxin or foreign-object exposure.'
where id = 'vomiting_dog_source';

update public.concern_guidance
set
  common_settling_in = 'A loose stool can follow a change in food, routine, or environment, but the pattern matters. Note frequency, appearance, appetite, water intake, vomiting, and energy, without making sudden feeding or medication changes on your own.',
  ask_a_vet = 'Contact a veterinarian if diarrhea continues, repeats often, comes with vomiting or reduced appetite, or your cat seems less active. A veterinarian can decide whether an examination or tests are needed.',
  seek_urgent_care = 'Seek urgent veterinary care now for blood in stool, black tar-like stool, repeated diarrhea with vomiting, marked weakness, collapse, suspected toxin or foreign-object exposure, or signs your cat is becoming seriously unwell.'
where id = 'diarrhea_cat_source';

update public.concern_guidance
set
  common_settling_in = 'A loose stool can follow a change in food, routine, or environment, but the pattern matters. Note frequency, appearance, appetite, water intake, vomiting, and energy, without making sudden feeding or medication changes on your own.',
  ask_a_vet = 'Contact a veterinarian if diarrhea continues, repeats often, comes with vomiting or reduced appetite, or your dog seems less active. A veterinarian can decide whether an examination or tests are needed.',
  seek_urgent_care = 'Seek urgent veterinary care now for blood in stool, black tar-like stool, repeated diarrhea with vomiting, marked weakness, collapse, suspected toxin or foreign-object exposure, or signs your dog is becoming seriously unwell.'
where id = 'diarrhea_dog_source';

update public.concern_guidance
set
  common_settling_in = 'Hiding can be a normal response while a cat learns a new home, but it is useful to watch the whole picture. Make sure food, water, litter, rest, and a safe hiding place are easy to reach without forcing interaction.',
  ask_a_vet = 'Contact a veterinarian if hiding persists with eating, drinking, toileting, grooming, or movement changes, or if your cat seems tense or uncomfortable. Behaviour changes can also accompany pain or illness.',
  seek_urgent_care = 'Seek urgent veterinary care now if hiding is paired with breathing trouble, repeated vomiting, collapse, inability to urinate, or severe weakness.'
where id = 'hiding_or_fearful_cat_source';

do $$
begin
  if (select count(*) from public.concern_guidance where id in (
    'not_eating_or_drinking_cat', 'coughing_shared', 'potty_shared', 'scratching_shared',
    'vomiting_cat_source', 'vomiting_dog_source', 'diarrhea_cat_source', 'diarrhea_dog_source',
    'hiding_or_fearful_cat_source'
  )) <> 9 then
    raise exception 'Expected 9 localized concern guidance rows';
  end if;
end;
$$;
