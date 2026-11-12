create table if not exists public.growth_scout_outreach (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id text not null,
  recipient_email text not null,
  subject text not null,
  message text not null,
  source_url text not null,
  source_title text not null,
  status text not null check (status in ('pending', 'sent', 'failed')),
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (admin_user_id, opportunity_id)
);

alter table public.growth_scout_outreach enable row level security;

comment on table public.growth_scout_outreach is
  'Private audit log for individually approved Growth Scout invitation emails. Accessed by the server with the service role only.';
