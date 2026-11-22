-- Creator referral program: invite 3 new creators who publish an approved project.
create table if not exists public.creator_referral_codes (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);
create table if not exists public.creator_referrals (
  referred_user_id uuid primary key references public.profiles(id) on delete cascade,
  referrer_user_id uuid not null references public.profiles(id) on delete cascade,
  referred_at timestamptz not null default now(),
  qualified_at timestamptz,
  constraint creator_referrals_no_self check (referred_user_id <> referrer_user_id)
);
create index if not exists creator_referrals_referrer_idx on public.creator_referrals(referrer_user_id,qualified_at);

create or replace function public.ensure_creator_referral_code()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  insert into public.creator_referral_codes(user_id,code)
  values(new.id, lower(regexp_replace(coalesce(new.username,'creator'),'[^a-z0-9]','','g')) || '-' || substr(new.id::text,1,8))
  on conflict (user_id) do nothing;
  return new;
end; $$;

create or replace function public.capture_creator_referral_signup()
returns trigger language plpgsql security definer set search_path=''
as $$
declare code_text text; referrer uuid;
begin
  select raw_user_meta_data->>'referral_code' into code_text from auth.users where id=new.id;
  if code_text is not null and length(trim(code_text))>0 then
    select user_id into referrer from public.creator_referral_codes where code=trim(code_text);
    if referrer is not null and referrer <> new.id then
      insert into public.creator_referrals(referrer_user_id,referred_user_id)
      values(referrer,new.id) on conflict(referred_user_id) do nothing;
    end if;
  end if;
  return new;
end; $$;

create or replace function public.qualify_creator_referral_on_approval()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if new.status='approved' and (tg_op='INSERT' or old.status is distinct from 'approved') then
    update public.creator_referrals set qualified_at=coalesce(qualified_at,now())
    where referred_user_id=new.creator_id;
  end if;
  return new;
end; $$;

drop trigger if exists creator_referral_code_on_profile on public.profiles;
create trigger creator_referral_code_on_profile after insert on public.profiles
for each row execute function public.ensure_creator_referral_code();
drop trigger if exists creator_referral_signup_on_profile on public.profiles;
create trigger creator_referral_signup_on_profile after insert on public.profiles
for each row execute function public.capture_creator_referral_signup();
drop trigger if exists qualify_creator_referral_on_creation on public.creations;
create trigger qualify_creator_referral_on_creation after insert or update of status on public.creations
for each row execute function public.qualify_creator_referral_on_approval();

-- Create referral codes for existing creators.
insert into public.creator_referral_codes(user_id,code)
select p.id, lower(regexp_replace(coalesce(p.username,'creator'),'[^a-z0-9]','','g')) || '-' || substr(p.id::text,1,8)
from public.profiles p
on conflict(user_id) do nothing;

alter table public.creator_referral_codes enable row level security;
alter table public.creator_referrals enable row level security;
drop policy if exists "Users read own referral code" on public.creator_referral_codes;
create policy "Users read own referral code" on public.creator_referral_codes for select to authenticated using(user_id=auth.uid());
drop policy if exists "Users create own referral code" on public.creator_referral_codes;
create policy "Users create own referral code" on public.creator_referral_codes for insert to authenticated with check(user_id=auth.uid());
drop policy if exists "Referrers read their referrals" on public.creator_referrals;
create policy "Referrers read their referrals" on public.creator_referrals for select to authenticated using(referrer_user_id=auth.uid());
