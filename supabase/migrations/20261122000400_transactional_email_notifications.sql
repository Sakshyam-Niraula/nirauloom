create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  event_type text not null check (event_type in ('welcome','submitted','approved','rejected')),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_email text not null,
  status text not null default 'sending' check (status in ('sending','sent','failed')),
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
alter table public.notification_deliveries enable row level security;
revoke all on public.notification_deliveries from anon, authenticated;
grant all on public.notification_deliveries to service_role;
