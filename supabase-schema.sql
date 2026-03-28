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

grant execute on function public.accept_connection_invite(text) to authenticated;
