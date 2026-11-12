create table if not exists public.outreach_agent_settings (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null unique references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  target_description text not null default 'Independent creators and makers with a real project who may benefit from discovery.',
  minimum_fit_score integer not null default 75 check (minimum_fit_score between 50 and 100),
  daily_limit integer not null default 5 check (daily_limit between 1 and 5),
  tone text not null default 'Friendly, concise, specific, and respectful.',
  max_email_words integer not null default 120 check (max_email_words between 60 and 150),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.outreach_agent_settings enable row level security;

create policy "Admins can read their outreach agent settings"
on public.outreach_agent_settings for select
to authenticated
using (
  admin_user_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin = true
  )
);

create policy "Admins can insert their outreach agent settings"
on public.outreach_agent_settings for insert
to authenticated
with check (
  admin_user_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin = true
  )
);

create policy "Admins can update their outreach agent settings"
on public.outreach_agent_settings for update
to authenticated
using (
  admin_user_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin = true
  )
)
with check (
  admin_user_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin = true
  )
);

comment on table public.outreach_agent_settings is
  'Per-admin standing instructions for Nirauloom outreach. Sending is disabled by default until a verified mail provider and server-side automation are configured.';
