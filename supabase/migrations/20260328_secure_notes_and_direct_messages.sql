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

alter table public.direct_messages enable row level security;

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

drop policy if exists "Users can read their own or connected relationship" on public.connections;
drop policy if exists "Users can read their own connections" on public.connections;
create policy "Users can read their own or connected relationship"
on public.connections for select
using (auth.uid() = user_id or auth.uid() = partner_id);

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
