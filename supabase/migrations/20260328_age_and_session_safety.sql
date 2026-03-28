alter table public.profiles
add column if not exists age_range text check (age_range in ('Under 13', '13-17', '18+'));

create table if not exists public.account_security (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_session_key text,
  last_session_started_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.account_security enable row level security;

drop trigger if exists account_security_set_updated_at on public.account_security;
create trigger account_security_set_updated_at
before update on public.account_security
for each row
execute function public.set_updated_at();

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
