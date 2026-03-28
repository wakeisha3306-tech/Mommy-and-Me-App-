alter table public.journal_entries add column if not exists is_favorite boolean not null default false;
alter table public.affirmations add column if not exists is_favorite boolean not null default false;
alter table public.notes add column if not exists is_favorite boolean not null default false;

drop policy if exists "Users can update their own journal entries" on public.journal_entries;
create policy "Users can update their own journal entries"
on public.journal_entries for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own affirmations" on public.affirmations;
create policy "Users can update their own affirmations"
on public.affirmations for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own notes" on public.notes;
create policy "Users can update their own notes"
on public.notes for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
