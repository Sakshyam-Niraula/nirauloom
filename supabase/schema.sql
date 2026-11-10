-- ====================================================================
-- NIRAULOOM DATABASE SCHEMA & POLICIES
-- Platform: Supabase / PostgreSQL
-- ====================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (linked to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  bio text default '',
  avatar_url text default '',
  website text default '',
  twitter text default '',
  github text default '',
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint username_length check (char_length(username) >= 3 and char_length(username) <= 30)
);

-- 2. CATEGORIES TABLE
create table if not exists public.categories (
  id text primary key, -- slug like 'ecommerce', 'ai-machine-learning'
  name text not null,
  description text default '',
  icon text not null default 'Globe',
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. SUBCATEGORIES TABLE
create table if not exists public.subcategories (
  id text primary key, -- slug like 'dropshipping', 'd2c', 'b2b-marketplaces'
  category_id text references public.categories(id) on delete cascade not null,
  name text not null,
  description text default '',
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. CREATIONS TABLE
create table if not exists public.creations (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  tagline text not null,
  description text not null,
  website_url text not null,
  logo_url text not null,
  screenshots text[] default array[]::text[],
  category_id text references public.categories(id) on delete restrict not null,
  subcategory_id text references public.subcategories(id) on delete set null,
  pricing_type text default 'Free' check (pricing_type in ('Free', 'Freemium', 'Paid', 'Open Source', 'Contact')),
  is_featured boolean default false,
  is_student_indie boolean default false,
  origin_country text default 'Global',
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  appreciations_count integer default 0,
  bookmarks_count integer default 0,
  views_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. TAGS TABLE
create table if not exists public.tags (
  id text primary key, -- slug
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. CREATION_TAGS (Junction)
create table if not exists public.creation_tags (
  creation_id uuid references public.creations(id) on delete cascade not null,
  tag_id text references public.tags(id) on delete cascade not null,
  primary key (creation_id, tag_id)
);

-- 7. BOOKMARKS TABLE
create table if not exists public.bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  creation_id uuid references public.creations(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, creation_id)
);

-- 8. APPRECIATIONS TABLE
create table if not exists public.appreciations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  creation_id uuid references public.creations(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, creation_id)
);

-- 9. COLLECTIONS TABLE
create table if not exists public.collections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  slug text not null,
  description text default '',
  is_public boolean default true,
  items_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. COLLECTION_ITEMS TABLE
create table if not exists public.collection_items (
  id uuid default uuid_generate_v4() primary key,
  collection_id uuid references public.collections(id) on delete cascade not null,
  creation_id uuid references public.creations(id) on delete cascade not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(collection_id, creation_id)
);

-- 11. REPORTS TABLE
create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id) on delete set null,
  creation_id uuid references public.creations(id) on delete cascade not null,
  reason text not null,
  details text default '',
  status text default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================
create index if not exists idx_creations_status on public.creations(status);
create index if not exists idx_creations_category on public.creations(category_id);
create index if not exists idx_creations_creator on public.creations(creator_id);
create index if not exists idx_creations_featured on public.creations(is_featured) where is_featured = true;
create index if not exists idx_creations_student on public.creations(is_student_indie) where is_student_indie = true;
create index if not exists idx_creations_appreciations on public.creations(appreciations_count desc);
create index if not exists idx_creations_created on public.creations(created_at desc);
create index if not exists idx_bookmarks_user on public.bookmarks(user_id);
create index if not exists idx_appreciations_user on public.appreciations(user_id);
create index if not exists idx_collections_public on public.collections(is_public) where is_public = true;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.creations enable row level security;
alter table public.tags enable row level security;
alter table public.creation_tags enable row level security;
alter table public.bookmarks enable row level security;
alter table public.appreciations enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.reports enable row level security;

-- Profiles: Anyone can view profiles, users can only update their own profile
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Categories & Subcategories: Public read-only
create policy "Categories are viewable by everyone" on public.categories
  for select using (true);

create policy "Subcategories are viewable by everyone" on public.subcategories
  for select using (true);

-- Tags: Public read-only, authenticated can insert
create policy "Tags are viewable by everyone" on public.tags
  for select using (true);

create policy "Authenticated users can create tags" on public.tags
  for insert with check (auth.role() = 'authenticated');

-- Creations:
-- 1. Public can read approved creations
-- 2. Creator can read their own pending/rejected creations
-- 3. Admins can read all creations
create policy "Approved creations are viewable by everyone" on public.creations
  for select using (
    status = 'approved' 
    or (auth.uid() = creator_id)
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Authenticated users can submit creations" on public.creations
  for insert with check (auth.uid() = creator_id);

create policy "Creators can update their own creations" on public.creations
  for update using (
    auth.uid() = creator_id 
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Creators and admins can delete creations" on public.creations
  for delete using (
    auth.uid() = creator_id 
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Creation tags: public read, creators or admins can link
create policy "Creation tags are viewable by everyone" on public.creation_tags
  for select using (true);

create policy "Creators can manage creation tags" on public.creation_tags
  for all using (
    exists (
      select 1 from public.creations 
      where creations.id = creation_tags.creation_id 
      and (creations.creator_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
    )
  );

-- Bookmarks: private to owner
create policy "Users can view own bookmarks" on public.bookmarks
  for select using (auth.uid() = user_id);

create policy "Users can add bookmarks" on public.bookmarks
  for insert with check (auth.uid() = user_id);

create policy "Users can remove own bookmarks" on public.bookmarks
  for delete using (auth.uid() = user_id);

-- Appreciations: public view, users can insert/delete own
create policy "Appreciations are viewable by everyone" on public.appreciations
  for select using (true);

create policy "Users can add appreciations" on public.appreciations
  for insert with check (auth.uid() = user_id);

create policy "Users can remove own appreciations" on public.appreciations
  for delete using (auth.uid() = user_id);

-- Collections:
create policy "Public collections are viewable by everyone" on public.collections
  for select using (is_public = true or auth.uid() = user_id);

create policy "Users can create collections" on public.collections
  for insert with check (auth.uid() = user_id);

create policy "Users can update own collections" on public.collections
  for update using (auth.uid() = user_id);

create policy "Users can delete own collections" on public.collections
  for delete using (auth.uid() = user_id);

-- Collection items:
create policy "Collection items are viewable if collection is visible" on public.collection_items
  for select using (
    exists (
      select 1 from public.collections 
      where collections.id = collection_items.collection_id 
      and (collections.is_public = true or collections.user_id = auth.uid())
    )
  );

create policy "Users can manage items in own collections" on public.collection_items
  for all using (
    exists (
      select 1 from public.collections 
      where collections.id = collection_items.collection_id 
      and collections.user_id = auth.uid()
    )
  );

-- Reports: Authenticated users can submit, only admins can view
create policy "Users can create reports" on public.reports
  for insert with check (auth.role() = 'authenticated');

create policy "Admins can view reports" on public.reports
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- ====================================================================
-- TRIGGERS & FUNCTIONS
-- ====================================================================

-- Sync Profile on Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/identicon/svg?seed=' || new.id::text)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger for appreciation count
create or replace function public.update_creation_appreciations_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.creations
    set appreciations_count = appreciations_count + 1
    where id = new.creation_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.creations
    set appreciations_count = greatest(appreciations_count - 1, 0)
    where id = old.creation_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_appreciation_change on public.appreciations;
create trigger on_appreciation_change
  after insert or delete on public.appreciations
  for each row execute procedure public.update_creation_appreciations_count();

-- Trigger for bookmark count
create or replace function public.update_creation_bookmarks_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.creations
    set bookmarks_count = bookmarks_count + 1
    where id = new.creation_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.creations
    set bookmarks_count = greatest(bookmarks_count - 1, 0)
    where id = old.creation_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_bookmark_change on public.bookmarks;
create trigger on_bookmark_change
  after insert or delete on public.bookmarks
  for each row execute procedure public.update_creation_bookmarks_count();

-- Trigger for collection item count
create or replace function public.update_collection_items_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.collections
    set items_count = items_count + 1
    where id = new.collection_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.collections
    set items_count = greatest(items_count - 1, 0)
    where id = old.collection_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_collection_item_change on public.collection_items;
create trigger on_collection_item_change
  after insert or delete on public.collection_items
  for each row execute procedure public.update_collection_items_count();
