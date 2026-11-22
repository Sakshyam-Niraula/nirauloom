create table if not exists public.spotlight_editions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_by uuid not null references auth.users(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint spotlight_dates_valid check (end_date >= start_date)
);
create table if not exists public.spotlight_entries (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.spotlight_editions(id) on delete cascade,
  creation_id uuid not null references public.creations(id) on delete restrict,
  creator_id uuid not null references public.profiles(id) on delete restrict,
  position smallint not null check (position between 1 and 3),
  recognition_note text not null default '',
  created_at timestamptz not null default now(),
  unique (edition_id, position),
  unique (edition_id, creation_id),
  unique (edition_id, creator_id)
);
create index if not exists spotlight_editions_public_idx on public.spotlight_editions(status,start_date desc);
create index if not exists spotlight_entries_edition_idx on public.spotlight_entries(edition_id,position);
alter table public.spotlight_editions enable row level security;
alter table public.spotlight_entries enable row level security;

drop policy if exists "Public read published spotlight editions" on public.spotlight_editions;
create policy "Public read published spotlight editions" on public.spotlight_editions for select to anon, authenticated using (status in ('published','archived'));
drop policy if exists "Admins manage spotlight editions" on public.spotlight_editions;
create policy "Admins manage spotlight editions" on public.spotlight_editions for all to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin=true)) with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin=true));

drop policy if exists "Public read entries of public editions" on public.spotlight_entries;
create policy "Public read entries of public editions" on public.spotlight_entries for select to anon, authenticated using (exists(select 1 from public.spotlight_editions e where e.id=edition_id and e.status in ('published','archived')));
drop policy if exists "Admins manage spotlight entries" on public.spotlight_entries;
create policy "Admins manage spotlight entries" on public.spotlight_entries for all to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin=true)) with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin=true));
