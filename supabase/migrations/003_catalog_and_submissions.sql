-- Catalog sounds (approved, public) + user submission workflow

create table if not exists public.catalog_sounds (
  id text primary key,
  slug text unique not null,
  title text not null,
  storage_path text not null,
  file_url text not null,
  category text not null default 'Custom',
  tags jsonb not null default '[]'::jsonb,
  emoji text not null default '🎵',
  duration numeric not null default 0,
  is_active boolean not null default true,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.sound_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  storage_path text not null,
  file_url text not null,
  emoji text not null default '🎵',
  tags jsonb not null default '[]'::jsonb,
  category text not null default 'Custom',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  private_sound_id text not null,
  catalog_sound_id text references public.catalog_sounds (id),
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists sound_submissions_status_idx on public.sound_submissions (status);
create index if not exists sound_submissions_user_idx on public.sound_submissions (user_id);

alter table public.catalog_sounds enable row level security;
alter table public.sound_submissions enable row level security;

-- Catalog: public read active sounds; admin write
create policy "catalog_sounds_select_active"
  on public.catalog_sounds for select
  using (is_active = true);

create policy "catalog_sounds_admin_all"
  on public.catalog_sounds for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Submissions: users see/insert own; admin sees all and can update
create policy "sound_submissions_select_own"
  on public.sound_submissions for select
  using (auth.uid() = user_id);

create policy "sound_submissions_insert_own"
  on public.sound_submissions for insert
  with check (auth.uid() = user_id);

create policy "sound_submissions_admin_select"
  on public.sound_submissions for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "sound_submissions_admin_update"
  on public.sound_submissions for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Storage buckets
insert into storage.buckets (id, name, public)
values
  ('catalog-sounds', 'catalog-sounds', true),
  ('user-submissions', 'user-submissions', true)
on conflict (id) do nothing;

-- Catalog sounds: public read
create policy "catalog_sounds_storage_read"
  on storage.objects for select
  using (bucket_id = 'catalog-sounds');

create policy "catalog_sounds_storage_admin_write"
  on storage.objects for insert
  with check (
    bucket_id = 'catalog-sounds'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "catalog_sounds_storage_admin_update"
  on storage.objects for update
  using (
    bucket_id = 'catalog-sounds'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "catalog_sounds_storage_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'catalog-sounds'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- User submissions: users upload/read own folder
create policy "user_submissions_storage_read"
  on storage.objects for select
  using (bucket_id = 'user-submissions');

create policy "user_submissions_storage_upload_own"
  on storage.objects for insert
  with check (
    bucket_id = 'user-submissions'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "user_submissions_storage_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'user-submissions'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
