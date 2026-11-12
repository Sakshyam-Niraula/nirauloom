create table if not exists public.outreach_gmail_connections (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  encrypted_refresh_token text not null,
  encryption_iv text not null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.outreach_gmail_connections enable row level security;
revoke all on public.outreach_gmail_connections from anon, authenticated;
grant all on public.outreach_gmail_connections to service_role;
