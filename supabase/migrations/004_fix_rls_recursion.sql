-- Fix infinite recursion: admin policies must not query profiles under RLS.
-- Run in Supabase SQL Editor after migrations 001–003.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to anon;

-- profiles
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_admin());

-- admin_settings
drop policy if exists "admin_settings_write_admin" on public.admin_settings;
create policy "admin_settings_write_admin"
  on public.admin_settings for all
  using (public.is_admin());

-- catalog_overrides
drop policy if exists "catalog_overrides_write_admin" on public.catalog_overrides;
create policy "catalog_overrides_write_admin"
  on public.catalog_overrides for all
  using (public.is_admin());

-- catalog_sounds (migration 003)
drop policy if exists "catalog_sounds_admin_all" on public.catalog_sounds;
create policy "catalog_sounds_admin_all"
  on public.catalog_sounds for all
  using (public.is_admin());

-- sound_submissions (migration 003)
drop policy if exists "sound_submissions_admin_select" on public.sound_submissions;
create policy "sound_submissions_admin_select"
  on public.sound_submissions for select
  using (public.is_admin());

drop policy if exists "sound_submissions_admin_update" on public.sound_submissions;
create policy "sound_submissions_admin_update"
  on public.sound_submissions for update
  using (public.is_admin());

-- storage (migration 003)
drop policy if exists "catalog_sounds_storage_admin_write" on storage.objects;
create policy "catalog_sounds_storage_admin_write"
  on storage.objects for insert
  with check (bucket_id = 'catalog-sounds' and public.is_admin());

drop policy if exists "catalog_sounds_storage_admin_update" on storage.objects;
create policy "catalog_sounds_storage_admin_update"
  on storage.objects for update
  using (bucket_id = 'catalog-sounds' and public.is_admin());

drop policy if exists "catalog_sounds_storage_admin_delete" on storage.objects;
create policy "catalog_sounds_storage_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'catalog-sounds' and public.is_admin());
