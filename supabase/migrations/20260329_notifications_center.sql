create table if not exists public.notification_reads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('connection_joined', 'shared_note', 'direct_message', 'family_note', 'mood_alert')),
  source_id text not null,
  read_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, source_type, source_id)
);

create index if not exists notification_reads_user_created_idx
on public.notification_reads (user_id, created_at desc);

alter table public.notification_reads enable row level security;

drop policy if exists "Users can read their own notification reads" on public.notification_reads;
create policy "Users can read their own notification reads"
on public.notification_reads for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own notification reads" on public.notification_reads;
create policy "Users can insert their own notification reads"
on public.notification_reads for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own notification reads" on public.notification_reads;
create policy "Users can update their own notification reads"
on public.notification_reads for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own notification reads" on public.notification_reads;
create policy "Users can delete their own notification reads"
on public.notification_reads for delete
using (auth.uid() = user_id);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  connection_updates boolean not null default true,
  shared_notes boolean not null default true,
  direct_messages boolean not null default true,
  family_messages boolean not null default true,
  mood_alerts boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row
execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;

drop policy if exists "Users can read their own notification preferences" on public.notification_preferences;
create policy "Users can read their own notification preferences"
on public.notification_preferences for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own notification preferences" on public.notification_preferences;
create policy "Users can insert their own notification preferences"
on public.notification_preferences for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own notification preferences" on public.notification_preferences;
create policy "Users can update their own notification preferences"
on public.notification_preferences for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
