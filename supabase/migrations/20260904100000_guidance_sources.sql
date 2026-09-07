create table if not exists public.guidance_sources (
  id text primary key,
  title text not null,
  publisher text not null,
  original_url text not null unique,
  summary text,
  reviewed_at date
);

alter table public.concern_guidance
  add column if not exists source_id text references public.guidance_sources(id);

alter table public.guidance_sources enable row level security;
drop policy if exists "Anyone can read reviewed guidance sources" on public.guidance_sources;
create policy "Anyone can read reviewed guidance sources"
on public.guidance_sources for select to anon, authenticated
using (summary is not null and reviewed_at is not null);

insert into public.guidance_sources (id, title, publisher, original_url)
values
  ('msd-respiratory', 'MSD Veterinary Manual: Clinical Signs of Respiratory Disease in Animals', 'MSD Veterinary Manual', 'https://www.merckvetmanual.com/respiratory-system/respiratory-system-introduction/clinical-signs-of-respiratory-disease-in-animals'),
  ('msd-urinary', 'MSD Veterinary Manual: Urethral Obstruction in Small Animals', 'MSD Veterinary Manual', 'https://www.merckvetmanual.com/urinary-system/urolithiasis-in-small-animals/urethral-obstruction-in-small-animals'),
  ('rspca-fleas', 'RSPCA: How to Get Rid of Fleas', 'RSPCA', 'https://www.rspca.org.uk/adviceandwelfare/pets/general/fleas'),
  ('cornell-anorexia', 'Cornell Feline Health Center: Anorexia', 'Cornell Feline Health Center', 'https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/anorexia'),
  ('msd-cat-digestive', 'MSD Veterinary Manual: Disorders of the Stomach and Intestines in Cats', 'MSD Veterinary Manual', 'https://www.merckvetmanual.com/cat-owners/digestive-disorders-of-cats/disorders-of-the-stomach-and-intestines-in-cats'),
  ('msd-dog-digestive', 'MSD Veterinary Manual: Disorders of the Stomach and Intestines in Dogs', 'MSD Veterinary Manual', 'https://www.merckvetmanual.com/dog-owners/digestive-disorders-of-dogs/disorders-of-the-stomach-and-intestines-in-dogs'),
  ('rspca-cat-behavior', 'RSPCA: Understanding Your Cat''s Behaviour', 'RSPCA', 'https://www.rspca.org.uk/adviceandwelfare/pets/cats/behaviour')
on conflict (id) do update set title = excluded.title, publisher = excluded.publisher, original_url = excluded.original_url;

update public.concern_guidance set source_id = 'msd-respiratory' where id = 'coughing_shared';
update public.concern_guidance set source_id = 'msd-urinary' where id = 'potty_shared';
update public.concern_guidance set source_id = 'rspca-fleas' where id = 'scratching_shared';
update public.concern_guidance set source_id = 'cornell-anorexia' where id = 'not_eating_or_drinking_cat';
update public.concern_guidance set source_id = 'msd-cat-digestive' where id in ('vomiting_cat_source', 'diarrhea_cat_source');
update public.concern_guidance set source_id = 'msd-dog-digestive' where id in ('vomiting_dog_source', 'diarrhea_dog_source');
update public.concern_guidance set source_id = 'rspca-cat-behavior' where id = 'hiding_or_fearful_cat_source';

do $$
begin
  if (select count(*) from public.guidance_sources) <> 7 then
    raise exception 'Expected 7 guidance sources';
  end if;
  if (select count(*) from public.concern_guidance where source_id is not null) <> 9 then
    raise exception 'Expected 9 mapped concern guidance rows';
  end if;
end;
$$;
