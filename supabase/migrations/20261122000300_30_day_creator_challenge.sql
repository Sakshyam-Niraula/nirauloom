create table if not exists public.creator_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'NIRAULOOM 30 Days Creator Challenge',
  description text not null default 'Create and publish a project during the 30-day challenge.',
  start_date date not null,
  end_date date not null,
  status text not null default 'upcoming' check(status in ('upcoming','active','completed')),
  winner_user_id uuid references public.profiles(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creator_challenge_dates check(end_date >= start_date)
);
create table if not exists public.creator_challenge_participants (
  challenge_id uuid not null references public.creator_challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key(challenge_id,user_id)
);
create index if not exists creator_challenge_participants_user_idx on public.creator_challenge_participants(user_id);
alter table public.creator_challenges enable row level security;
alter table public.creator_challenge_participants enable row level security;
drop policy if exists "Public read challenge" on public.creator_challenges;
create policy "Public read challenge" on public.creator_challenges for select to anon,authenticated using(true);
drop policy if exists "Admins manage challenge" on public.creator_challenges;
create policy "Admins manage challenge" on public.creator_challenges for all to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin=true)) with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin=true));
drop policy if exists "Users join challenge" on public.creator_challenge_participants;
create policy "Users join challenge" on public.creator_challenge_participants for insert to authenticated with check(user_id=auth.uid());
drop policy if exists "Users read own challenge entry" on public.creator_challenge_participants;
create policy "Users read own challenge entry" on public.creator_challenge_participants for select to authenticated using(user_id=auth.uid());
drop policy if exists "Admins read participants" on public.creator_challenge_participants;
create policy "Admins read participants" on public.creator_challenge_participants for select to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin=true));
