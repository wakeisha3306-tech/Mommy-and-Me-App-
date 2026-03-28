create table if not exists public.moment_reactions (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('note', 'direct_message')),
  item_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (reaction in ('💛', '🤍', '🫶', 'I''m here')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, item_type, item_id)
);

create index if not exists moment_reactions_lookup_idx
on public.moment_reactions (item_type, item_id, created_at desc);

alter table public.moment_reactions enable row level security;

drop policy if exists "Users can read visible moment reactions" on public.moment_reactions;
create policy "Users can read visible moment reactions"
on public.moment_reactions for select
using (
  (
    item_type = 'note'
    and exists (
      select 1
      from public.notes
      where notes.id = moment_reactions.item_id
        and (
          auth.uid() = notes.user_id
          or (
            notes.visibility = 'between_us'
            and notes.partner_id = auth.uid()
            and public.are_connected(notes.user_id, auth.uid())
          )
          or (
            notes.visibility = 'family'
            and notes.family_owner_id is not null
            and public.is_in_family(auth.uid(), notes.family_owner_id)
          )
        )
    )
  )
  or (
    item_type = 'direct_message'
    and exists (
      select 1
      from public.direct_messages
      where direct_messages.id = moment_reactions.item_id
        and (auth.uid() = direct_messages.sender_id or auth.uid() = direct_messages.recipient_id)
    )
  )
);

drop policy if exists "Users can create their own visible moment reactions" on public.moment_reactions;
create policy "Users can create their own visible moment reactions"
on public.moment_reactions for insert
with check (
  auth.uid() = user_id
  and (
    (
      item_type = 'note'
      and exists (
        select 1
        from public.notes
        where notes.id = moment_reactions.item_id
          and (
            auth.uid() = notes.user_id
            or (
              notes.visibility = 'between_us'
              and notes.partner_id = auth.uid()
              and public.are_connected(notes.user_id, auth.uid())
            )
            or (
              notes.visibility = 'family'
              and notes.family_owner_id is not null
              and public.is_in_family(auth.uid(), notes.family_owner_id)
            )
          )
      )
    )
    or (
      item_type = 'direct_message'
      and exists (
        select 1
        from public.direct_messages
        where direct_messages.id = moment_reactions.item_id
          and (auth.uid() = direct_messages.sender_id or auth.uid() = direct_messages.recipient_id)
      )
    )
  )
);

drop policy if exists "Users can update their own moment reactions" on public.moment_reactions;
create policy "Users can update their own moment reactions"
on public.moment_reactions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own moment reactions" on public.moment_reactions;
create policy "Users can delete their own moment reactions"
on public.moment_reactions for delete
using (auth.uid() = user_id);
