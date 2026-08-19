begin;

-- Recipe/ration catalog photos are non-sensitive marketing content served to every
-- user, so content-images is made public-read here to let the frontend and GitHub
-- Pages load them directly as CDN URLs instead of paying for a signed-URL round
-- trip through an Edge Function on every image. AI-generated recipe images cached
-- in this same bucket (see supabase/functions/recipe-image) are unaffected: they
-- keep working via their existing signed URLs, which remain valid on a public bucket.
insert into storage.buckets (id, name, public)
values ('content-images', 'content-images', true)
on conflict (id) do update set public = true;

-- Public buckets still require an explicit read policy for anon/authenticated roles.
drop policy if exists "content-images public read" on storage.objects;
create policy "content-images public read"
  on storage.objects for select
  to public
  using (bucket_id = 'content-images');

commit;
