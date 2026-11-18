-- Conversion funnel events. No email, IP address, or other direct identity is collected.
create table if not exists public.conversion_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (event_name in (
    'homepage_view',
    'signup_cta_click',
    'signup_form_submitted',
    'signup_email_sent',
    'auth_completed',
    'project_submission_succeeded'
  )),
  anonymous_id uuid,
  user_id uuid references auth.users(id) on delete set null,
  page_path text not null default '/',
  created_at timestamptz not null default now()
);

alter table public.conversion_events enable row level security;

create index if not exists idx_conversion_events_created
  on public.conversion_events(created_at desc);

create index if not exists idx_conversion_events_name_created
  on public.conversion_events(event_name, created_at desc);

drop policy if exists "Anyone can record conversion events" on public.conversion_events;
create policy "Anyone can record conversion events"
  on public.conversion_events for insert to anon, authenticated
  with check (true);

drop policy if exists "Admins can read conversion events" on public.conversion_events;
create policy "Admins can read conversion events"
  on public.conversion_events for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );
