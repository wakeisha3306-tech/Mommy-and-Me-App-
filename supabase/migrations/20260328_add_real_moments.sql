create table if not exists public.real_moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.real_moments enable row level security;

drop policy if exists "Users can read their own real moments" on public.real_moments;
create policy "Users can read their own real moments"
on public.real_moments for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own real moments" on public.real_moments;
create policy "Users can insert their own real moments"
on public.real_moments for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own real moments" on public.real_moments;
create policy "Users can delete their own real moments"
on public.real_moments for delete
using (auth.uid() = user_id);
