create extension if not exists "pgcrypto";

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author text not null check (author in ('Mom', 'Daughter')),
  text text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.affirmations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  emoji text,
  source text not null default 'custom' check (source in ('preset', 'custom')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author text not null check (author in ('Mom', 'Daughter')),
  text text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.journal_entries enable row level security;
alter table public.affirmations enable row level security;
alter table public.notes enable row level security;

drop policy if exists "Users can read their own journal entries" on public.journal_entries;
create policy "Users can read their own journal entries"
on public.journal_entries for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own journal entries" on public.journal_entries;
create policy "Users can insert their own journal entries"
on public.journal_entries for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own journal entries" on public.journal_entries;
create policy "Users can delete their own journal entries"
on public.journal_entries for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read their own affirmations" on public.affirmations;
create policy "Users can read their own affirmations"
on public.affirmations for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own affirmations" on public.affirmations;
create policy "Users can insert their own affirmations"
on public.affirmations for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own affirmations" on public.affirmations;
create policy "Users can delete their own affirmations"
on public.affirmations for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read their own notes" on public.notes;
create policy "Users can read their own notes"
on public.notes for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own notes" on public.notes;
create policy "Users can insert their own notes"
on public.notes for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own notes" on public.notes;
create policy "Users can delete their own notes"
on public.notes for delete
using (auth.uid() = user_id);
