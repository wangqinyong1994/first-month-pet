alter table public.concern_guidance
  add column if not exists source_title text,
  add column if not exists source_url text,
  add column if not exists reviewed_at date;

alter table public.concern_guidance
  add constraint concern_guidance_source_metadata_complete
  check (
    (source_title is null and source_url is null)
    or (source_title is not null and source_url is not null)
  );
