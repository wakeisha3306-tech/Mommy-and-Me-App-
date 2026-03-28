create extension if not exists "pgcrypto";

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author text not null check (author in ('Mom', 'Daughter')),
  text text not null,
  is_favorite boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.affirmations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  emoji text,
  source text not null default 'custom' check (source in ('preset', 'custom')),
  is_favorite boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author text not null check (author in ('Mom', 'Daughter')),
  text text not null,
  is_favorite boolean not null default false,
  is_shared boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.real_moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  partner_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('Mom', 'Daughter')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id),
  unique (user_id, partner_id)
);

create table if not exists public.connection_invites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique,
  role text not null check (role in ('Mom', 'Daughter')),
  created_at timestamptz not null default timezone('utc', now()),
  used_at timestamptz
);

create or replace function public.are_connected(first_user uuid, second_user uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.connections
    where user_id = first_user
      and partner_id = second_user
  )
  and exists (
    select 1
    from public.connections
    where user_id = second_user
      and partner_id = first_user
  );
$$;

grant execute on function public.are_connected(uuid, uuid) to authenticated;

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('Mom', 'Daughter')),
  text text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint direct_messages_not_self check (sender_id <> recipient_id)
);

alter table public.journal_entries add column if not exists is_favorite boolean not null default false;
alter table public.affirmations add column if not exists is_favorite boolean not null default false;
alter table public.notes add column if not exists is_favorite boolean not null default false;
alter table public.notes add column if not exists is_shared boolean not null default false;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null check (role in ('Mom', 'Daughter')),
  age_range text check (age_range in ('Under 13', '13-17', '18+')),
  password_updated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles add column if not exists password_updated_at timestamptz;
alter table public.profiles add column if not exists age_range text check (age_range in ('Under 13', '13-17', '18+'));

create table if not exists public.account_security (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_session_key text,
  last_session_started_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists account_security_set_updated_at on public.account_security;
create trigger account_security_set_updated_at
before update on public.account_security
for each row
execute function public.set_updated_at();

alter table public.journal_entries enable row level security;
alter table public.affirmations enable row level security;
alter table public.notes enable row level security;
alter table public.real_moments enable row level security;
alter table public.connections enable row level security;
alter table public.connection_invites enable row level security;
alter table public.profiles enable row level security;
alter table public.direct_messages enable row level security;
alter table public.account_security enable row level security;

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

drop policy if exists "Users can update their own journal entries" on public.journal_entries;
create policy "Users can update their own journal entries"
on public.journal_entries for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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

drop policy if exists "Users can update their own affirmations" on public.affirmations;
create policy "Users can update their own affirmations"
on public.affirmations for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read their own notes" on public.notes;
drop policy if exists "Users can read visible notes" on public.notes;
create policy "Users can read visible notes"
on public.notes for select
using (
  auth.uid() = user_id
  or (
    is_shared = true
    and public.are_connected(user_id, auth.uid())
  )
);

drop policy if exists "Users can insert their own notes" on public.notes;
create policy "Users can insert their own notes"
on public.notes for insert
with check (
  auth.uid() = user_id
  and (
    is_shared = false
    or exists (
      select 1
      from public.connections
      where connections.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can delete their own notes" on public.notes;
create policy "Users can delete their own notes"
on public.notes for delete
using (auth.uid() = user_id);

drop policy if exists "Users can update their own notes" on public.notes;
create policy "Users can update their own notes"
on public.notes for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    is_shared = false
    or exists (
      select 1
      from public.connections
      where connections.user_id = auth.uid()
    )
  )
);

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

drop policy if exists "Users can read their own or connected relationship" on public.connections;
drop policy if exists "Users can read their own connections" on public.connections;
create policy "Users can read their own or connected relationship"
on public.connections for select
using (auth.uid() = user_id or auth.uid() = partner_id);

drop policy if exists "Users can read their own invites" on public.connection_invites;
create policy "Users can read their own invites"
on public.connection_invites for select
using (auth.uid() = user_id);

drop policy if exists "Users can create their own invites" on public.connection_invites;
create policy "Users can create their own invites"
on public.connection_invites for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (
        age_range in ('13-17', '18+')
        or role = 'Mom'
      )
  )
);

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can read their own account security" on public.account_security;
create policy "Users can read their own account security"
on public.account_security for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own account security" on public.account_security;
create policy "Users can insert their own account security"
on public.account_security for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own account security" on public.account_security;
create policy "Users can update their own account security"
on public.account_security for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Participants can read direct messages" on public.direct_messages;
create policy "Participants can read direct messages"
on public.direct_messages for select
using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "Connected users can send direct messages" on public.direct_messages;
create policy "Connected users can send direct messages"
on public.direct_messages for insert
with check (
  auth.uid() = sender_id
  and public.are_connected(sender_id, recipient_id)
);

create or replace function public.accept_connection_invite(invite_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_role text;
  current_age_range text;
  invite_age_range text;
  invite_record public.connection_invites%rowtype;
begin
  if current_user_id is null then
    raise exception 'You must be signed in to connect accounts.';
  end if;

  select *
  into invite_record
  from public.connection_invites
  where upper(code) = upper(invite_code)
    and used_at is null
  limit 1;

  if invite_record.id is null then
    raise exception 'That invite code is not valid anymore.';
  end if;

  if invite_record.user_id = current_user_id then
    raise exception 'You cannot use your own invite code.';
  end if;

  select role, age_range
  into current_role, current_age_range
  from public.profiles
  where id = current_user_id;

  if current_role is null then
    raise exception 'Finish your profile before connecting accounts.';
  end if;

  select age_range
  into invite_age_range
  from public.profiles
  where id = invite_record.user_id;

  if current_role = invite_record.role then
    raise exception 'Mom should connect with Daughter, and Daughter should connect with Mom.';
  end if;

  if current_age_range = 'Under 13' or invite_age_range = 'Under 13' then
    if invite_record.role <> 'Mom' then
      raise exception 'For younger children, Mom needs to start the connection first.';
    end if;
  end if;

  if exists (
    select 1
    from public.connections
    where user_id in (current_user_id, invite_record.user_id)
  ) then
    raise exception 'One of these accounts is already connected.';
  end if;

  insert into public.connections (user_id, partner_id, role)
  values
    (invite_record.user_id, current_user_id, invite_record.role),
    (current_user_id, invite_record.user_id, current_role);

  update public.connection_invites
  set used_at = timezone('utc', now())
  where id = invite_record.id;
end;
$$;

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

grant execute on function public.accept_connection_invite(text) to authenticated;

alter table public.notes
add column if not exists visibility text;

alter table public.notes
add column if not exists partner_id uuid references auth.users(id) on delete cascade;

alter table public.notes
add column if not exists family_owner_id uuid references auth.users(id) on delete cascade;

update public.notes
set visibility = case when is_shared then 'between_us' else 'private' end
where visibility is null;

create or replace function public.get_mom_id(target_user uuid)
returns uuid
language sql
security definer
set search_path = public
as $$
  select case
    when exists (
      select 1
      from public.profiles
      where id = target_user
        and role = 'Mom'
    ) then target_user
    else (
      select partner_id
      from public.connections
      where user_id = target_user
        and role = 'Daughter'
      order by created_at asc
      limit 1
    )
  end;
$$;

grant execute on function public.get_mom_id(uuid) to authenticated;

update public.notes
set family_owner_id = public.get_mom_id(user_id)
where family_owner_id is null
  and visibility in ('between_us', 'family');

update public.notes as note
set partner_id = connection.partner_id
from public.connections as connection
where note.partner_id is null
  and note.visibility = 'between_us'
  and note.user_id = connection.user_id;

alter table public.notes
alter column visibility set default 'private';

alter table public.notes
drop constraint if exists notes_visibility_check;

alter table public.notes
add constraint notes_visibility_check
check (visibility in ('private', 'between_us', 'family'));

alter table public.notes
alter column visibility set not null;

create or replace function public.is_in_family(viewer uuid, mom_user uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select viewer = mom_user
    or exists (
      select 1
      from public.connections
      where user_id = viewer
        and partner_id = mom_user
        and role = 'Daughter'
    );
$$;

grant execute on function public.is_in_family(uuid, uuid) to authenticated;

alter table public.connections
drop constraint if exists connections_user_id_key;

create unique index if not exists connections_daughter_single_mom_idx
on public.connections (user_id)
where role = 'Daughter';

drop policy if exists "Users can read visible notes" on public.notes;
create policy "Users can read visible notes"
on public.notes for select
using (
  auth.uid() = user_id
  or (
    visibility = 'between_us'
    and partner_id = auth.uid()
    and public.are_connected(user_id, auth.uid())
  )
  or (
    visibility = 'family'
    and family_owner_id is not null
    and public.is_in_family(auth.uid(), family_owner_id)
  )
);

drop policy if exists "Users can insert their own notes" on public.notes;
create policy "Users can insert their own notes"
on public.notes for insert
with check (
  auth.uid() = user_id
  and (
    (
      visibility = 'private'
      and partner_id is null
      and family_owner_id is null
    )
    or (
      visibility = 'between_us'
      and partner_id is not null
      and family_owner_id = public.get_mom_id(auth.uid())
      and public.are_connected(auth.uid(), partner_id)
    )
    or (
      visibility = 'family'
      and partner_id is null
      and family_owner_id = public.get_mom_id(auth.uid())
      and exists (
        select 1
        from public.connections
        where user_id = auth.uid()
           or partner_id = auth.uid()
      )
    )
  )
);

drop policy if exists "Users can update their own notes" on public.notes;
create policy "Users can update their own notes"
on public.notes for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    (
      visibility = 'private'
      and partner_id is null
      and family_owner_id is null
    )
    or (
      visibility = 'between_us'
      and partner_id is not null
      and family_owner_id = public.get_mom_id(auth.uid())
      and public.are_connected(auth.uid(), partner_id)
    )
    or (
      visibility = 'family'
      and partner_id is null
      and family_owner_id = public.get_mom_id(auth.uid())
      and exists (
        select 1
        from public.connections
        where user_id = auth.uid()
           or partner_id = auth.uid()
      )
    )
  )
);

drop policy if exists "Users can create their own invites" on public.connection_invites;
create policy "Users can create their own invites"
on public.connection_invites for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (
        role = 'Mom'
        or (
          role = 'Daughter'
          and age_range in ('13-17', '18+')
          and not exists (
            select 1
            from public.connections
            where user_id = auth.uid()
              and role = 'Daughter'
          )
        )
      )
  )
);

create or replace function public.accept_connection_invite(invite_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_role text;
  current_age_range text;
  invite_age_range text;
  mom_user_id uuid;
  daughter_user_id uuid;
  invite_record public.connection_invites%rowtype;
begin
  if current_user_id is null then
    raise exception 'You must be signed in to connect accounts.';
  end if;

  select *
  into invite_record
  from public.connection_invites
  where upper(code) = upper(invite_code)
    and used_at is null
  limit 1;

  if invite_record.id is null then
    raise exception 'That invite code is not valid anymore.';
  end if;

  if invite_record.user_id = current_user_id then
    raise exception 'You cannot use your own invite code.';
  end if;

  select role, age_range
  into current_role, current_age_range
  from public.profiles
  where id = current_user_id;

  if current_role is null then
    raise exception 'Finish your profile before connecting accounts.';
  end if;

  select age_range
  into invite_age_range
  from public.profiles
  where id = invite_record.user_id;

  if current_role = invite_record.role then
    raise exception 'Mom should connect with Daughter, and Daughter should connect with Mom.';
  end if;

  if invite_record.role = 'Mom' then
    mom_user_id := invite_record.user_id;
    daughter_user_id := current_user_id;
  else
    mom_user_id := current_user_id;
    daughter_user_id := invite_record.user_id;
  end if;

  if current_age_range = 'Under 13' or invite_age_range = 'Under 13' then
    if invite_record.role <> 'Mom' then
      raise exception 'For younger children, Mom needs to start the connection first.';
    end if;
  end if;

  if exists (
    select 1
    from public.connections
    where user_id = daughter_user_id
      and role = 'Daughter'
  ) then
    raise exception 'This Daughter account is already connected to Mom.';
  end if;

  if exists (
    select 1
    from public.connections
    where user_id = mom_user_id
      and partner_id = daughter_user_id
  ) then
    raise exception 'These accounts are already connected.';
  end if;

  insert into public.connections (user_id, partner_id, role)
  values
    (mom_user_id, daughter_user_id, 'Mom'),
    (daughter_user_id, mom_user_id, 'Daughter');

  update public.connection_invites
  set used_at = timezone('utc', now())
  where id = invite_record.id;
end;
$$;
