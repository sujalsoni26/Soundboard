-- Password recovery: security question + hashed answer on profiles
alter table public.profiles
  add column if not exists security_question text,
  add column if not exists security_answer_hash text;

-- Users can read/update their own security fields when logged in
create policy "profiles_update_own_security"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
