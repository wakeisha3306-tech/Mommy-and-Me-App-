create table if not exists public.mood_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood text not null check (mood in ('good', 'okay', 'not_great', 'need_to_talk')),
  shared boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists mood_checkins_user_day_idx
on public.mood_checkins (user_id, ((created_at at time zone 'utc')::date));

alter table public.mood_checkins enable row level security;

drop policy if exists "Users can read their own mood checkins" on public.mood_checkins;
create policy "Users can read their own mood checkins"
on public.mood_checkins for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own mood checkins" on public.mood_checkins;
create policy "Users can insert their own mood checkins"
on public.mood_checkins for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own mood checkins" on public.mood_checkins;
create policy "Users can update their own mood checkins"
on public.mood_checkins for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own mood checkins" on public.mood_checkins;
create policy "Users can delete their own mood checkins"
on public.mood_checkins for delete
using (auth.uid() = user_id);

create table if not exists public.mood_support_alerts (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.mood_checkins(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('Mom', 'Daughter')),
  created_at timestamptz not null default timezone('utc', now()),
  viewed_at timestamptz,
  unique (checkin_id, recipient_id)
);

alter table public.mood_support_alerts enable row level security;

drop policy if exists "Participants can read mood support alerts" on public.mood_support_alerts;
create policy "Participants can read mood support alerts"
on public.mood_support_alerts for select
using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "Connected users can create mood support alerts" on public.mood_support_alerts;
create policy "Connected users can create mood support alerts"
on public.mood_support_alerts for insert
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.connections
    where user_id = sender_id
      and partner_id = recipient_id
  )
);

drop policy if exists "Senders can delete their mood support alerts" on public.mood_support_alerts;
create policy "Senders can delete their mood support alerts"
on public.mood_support_alerts for delete
using (auth.uid() = sender_id);

drop policy if exists "Recipients can mark mood support alerts viewed" on public.mood_support_alerts;
create policy "Recipients can mark mood support alerts viewed"
on public.mood_support_alerts for update
using (auth.uid() = recipient_id)
with check (auth.uid() = recipient_id);
