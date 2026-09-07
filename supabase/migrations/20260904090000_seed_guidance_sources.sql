update public.concern_guidance
set source_title = 'MSD Veterinary Manual: Clinical Signs of Respiratory Disease in Animals',
    source_url = 'https://www.merckvetmanual.com/respiratory-system/respiratory-system-introduction/clinical-signs-of-respiratory-disease-in-animals'
where id = 'coughing_shared';

update public.concern_guidance
set source_title = 'MSD Veterinary Manual: Urethral Obstruction in Small Animals',
    source_url = 'https://www.merckvetmanual.com/urinary-system/urolithiasis-in-small-animals/urethral-obstruction-in-small-animals'
where id = 'potty_shared';

update public.concern_guidance
set source_title = 'RSPCA: How to Get Rid of Fleas',
    source_url = 'https://www.rspca.org.uk/adviceandwelfare/pets/general/fleas'
where id = 'scratching_shared';

update public.concern_guidance
set source_title = 'Cornell Feline Health Center: Anorexia',
    source_url = 'https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/anorexia'
where id = 'not_eating_or_drinking_cat';

insert into public.concern_guidance
  (id, concern_key, pet_type, priority_rank, common_settling_in, ask_a_vet, seek_urgent_care, priority_reason, source_notes, source_title, source_url)
select
  'vomiting_cat_source', concern_key, 'cat', priority_rank, common_settling_in, ask_a_vet, seek_urgent_care, priority_reason, source_notes,
  'MSD Veterinary Manual: Disorders of the Stomach and Intestines in Cats',
  'https://www.merckvetmanual.com/cat-owners/digestive-disorders-of-cats/disorders-of-the-stomach-and-intestines-in-cats'
from public.concern_guidance
where id = 'vomiting_shared'
on conflict (id) do update set source_title = excluded.source_title, source_url = excluded.source_url;

insert into public.concern_guidance
  (id, concern_key, pet_type, priority_rank, common_settling_in, ask_a_vet, seek_urgent_care, priority_reason, source_notes, source_title, source_url)
select
  'vomiting_dog_source', concern_key, 'dog', priority_rank, common_settling_in, ask_a_vet, seek_urgent_care, priority_reason, source_notes,
  'MSD Veterinary Manual: Disorders of the Stomach and Intestines in Dogs',
  'https://www.merckvetmanual.com/dog-owners/digestive-disorders-of-dogs/disorders-of-the-stomach-and-intestines-in-dogs'
from public.concern_guidance
where id = 'vomiting_shared'
on conflict (id) do update set source_title = excluded.source_title, source_url = excluded.source_url;

insert into public.concern_guidance
  (id, concern_key, pet_type, priority_rank, common_settling_in, ask_a_vet, seek_urgent_care, priority_reason, source_notes, source_title, source_url)
select
  'diarrhea_cat_source', concern_key, 'cat', priority_rank, common_settling_in, ask_a_vet, seek_urgent_care, priority_reason, source_notes,
  'MSD Veterinary Manual: Disorders of the Stomach and Intestines in Cats',
  'https://www.merckvetmanual.com/cat-owners/digestive-disorders-of-cats/disorders-of-the-stomach-and-intestines-in-cats'
from public.concern_guidance
where id = 'diarrhea_shared'
on conflict (id) do update set source_title = excluded.source_title, source_url = excluded.source_url;

insert into public.concern_guidance
  (id, concern_key, pet_type, priority_rank, common_settling_in, ask_a_vet, seek_urgent_care, priority_reason, source_notes, source_title, source_url)
select
  'diarrhea_dog_source', concern_key, 'dog', priority_rank, common_settling_in, ask_a_vet, seek_urgent_care, priority_reason, source_notes,
  'MSD Veterinary Manual: Disorders of the Stomach and Intestines in Dogs',
  'https://www.merckvetmanual.com/dog-owners/digestive-disorders-of-dogs/disorders-of-the-stomach-and-intestines-in-dogs'
from public.concern_guidance
where id = 'diarrhea_shared'
on conflict (id) do update set source_title = excluded.source_title, source_url = excluded.source_url;

insert into public.concern_guidance
  (id, concern_key, pet_type, priority_rank, common_settling_in, ask_a_vet, seek_urgent_care, priority_reason, source_notes, source_title, source_url)
select
  'hiding_or_fearful_cat_source', concern_key, 'cat', priority_rank, common_settling_in, ask_a_vet, seek_urgent_care, priority_reason, source_notes,
  'RSPCA: Understanding Your Cat''s Behaviour',
  'https://www.rspca.org.uk/adviceandwelfare/pets/cats/behaviour'
from public.concern_guidance
where id = 'hiding_shared'
on conflict (id) do update set source_title = excluded.source_title, source_url = excluded.source_url;
