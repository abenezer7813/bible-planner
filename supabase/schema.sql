create table if not exists public.reading_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now(),
  constraint reading_progress_state_is_object check (jsonb_typeof(state) = 'object')
);

alter table public.reading_progress enable row level security;

drop policy if exists "Users can read their own reading progress" on public.reading_progress;
create policy "Users can read their own reading progress"
  on public.reading_progress
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own reading progress" on public.reading_progress;
create policy "Users can create their own reading progress"
  on public.reading_progress
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own reading progress" on public.reading_progress;
create policy "Users can update their own reading progress"
  on public.reading_progress
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.reading_progress to authenticated;
