-- Community comments: comments belong to approved project posts.
create table if not exists public.creation_comments (
  id uuid primary key default gen_random_uuid(),
  creation_id uuid not null references public.creations(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists creation_comments_creation_created_idx
  on public.creation_comments (creation_id, created_at desc);

alter table public.creation_comments enable row level security;

drop policy if exists "Comments on approved creations are public" on public.creation_comments;
create policy "Comments on approved creations are public"
on public.creation_comments for select
to public
using (
  exists (
    select 1 from public.creations c
    where c.id = creation_id and c.status = 'approved'
  )
  or author_id = (select auth.uid())
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin = true
  )
);

drop policy if exists "Signed-in users can comment on approved creations" on public.creation_comments;
create policy "Signed-in users can comment on approved creations"
on public.creation_comments for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and exists (
    select 1 from public.creations c
    where c.id = creation_id and c.status = 'approved'
  )
);

drop policy if exists "Authors and admins can delete comments" on public.creation_comments;
create policy "Authors and admins can delete comments"
on public.creation_comments for delete
to authenticated
using (
  author_id = (select auth.uid())
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin = true
  )
);
