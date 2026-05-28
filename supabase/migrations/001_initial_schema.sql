-- Meme Soundboard — Supabase schema
-- Run in Supabase SQL Editor or via Supabase CLI

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Personalization blob (matches client UserSyncData)
create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Site-wide admin settings
create table if not exists public.admin_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

-- Optional catalog overrides (admin can toggle sounds later)
create table if not exists public.catalog_overrides (
  sound_id text primary key,
  is_active boolean not null default true,
  title_override text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

-- Auto-create profile + empty preferences on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  insert into public.user_preferences (user_id, data)
  values (new.id, '{}'::jsonb);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.admin_settings enable row level security;
alter table public.catalog_overrides enable row level security;

-- Profiles: read own; admins read all
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_select_admin"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- User preferences: own row only
create policy "user_preferences_select_own"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "user_preferences_insert_own"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "user_preferences_update_own"
  on public.user_preferences for update
  using (auth.uid() = user_id);

-- Admin settings: everyone can read; only admins write
create policy "admin_settings_select_all"
  on public.admin_settings for select
  using (true);

create policy "admin_settings_write_admin"
  on public.admin_settings for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Catalog overrides: public read; admin write
create policy "catalog_overrides_select_all"
  on public.catalog_overrides for select
  using (true);

create policy "catalog_overrides_write_admin"
  on public.catalog_overrides for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Default admin settings
insert into public.admin_settings (key, value) values
  ('site', '{"maintenanceMode":false,"welcomeMessage":"","maxCustomSounds":50,"trendingLimit":8}'::jsonb)
on conflict (key) do nothing;

-- Storage bucket for custom uploads (create in Dashboard if this fails)
insert into storage.buckets (id, name, public)
values ('custom-sounds', 'custom-sounds', true)
on conflict (id) do nothing;

-- Storage policies: users upload to own folder
create policy "custom_sounds_public_read"
  on storage.objects for select
  using (bucket_id = 'custom-sounds');

create policy "custom_sounds_upload_own"
  on storage.objects for insert
  with check (
    bucket_id = 'custom-sounds'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "custom_sounds_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'custom-sounds'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
