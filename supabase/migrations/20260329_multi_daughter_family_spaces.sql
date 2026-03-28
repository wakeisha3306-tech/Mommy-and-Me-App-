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

drop constraint if exists notes_visibility_check on public.notes;
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
