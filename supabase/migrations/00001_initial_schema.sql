-- ============================================================
-- World Emotion Map — Initial Schema
-- ============================================================

-- 1. emotion_snapshots — hourly aggregated emotion data
create table public.emotion_snapshots (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null,
  country_code text,                          -- ISO 3166-1 alpha-2, NULL = global
  region_code text,                           -- sub-national region, NULL = country-level
  sector_slug text,                           -- FK to sectors.slug, NULL = all sectors
  continent text not null,
  joy float not null default 0,
  trust float not null default 0,
  fear float not null default 0,
  anger float not null default 0,
  sadness float not null default 0,
  surprise float not null default 0,
  uncertainty float not null default 0,
  optimism float not null default 0,
  article_count int not null default 0,
  sample_urls jsonb not null default '[]'::jsonb
);

create index idx_snapshots_timestamp on public.emotion_snapshots (timestamp desc);
create index idx_snapshots_country on public.emotion_snapshots (country_code, timestamp desc);
create index idx_snapshots_sector on public.emotion_snapshots (sector_slug, timestamp desc);

-- 2. sectors — master sector definitions
create table public.sectors (
  slug text primary key,
  name_en text not null,
  name_ja text not null,
  parent_slug text references public.sectors(slug),
  gdelt_themes text[] not null default '{}'
);

-- 3. profiles — user profiles (linked to auth.users)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  display_name text not null default '',
  locale text not null default 'en' check (locale in ('en', 'ja')),
  created_at timestamptz not null default now()
);

-- 4. favorites — user bookmarks
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('country', 'sector', 'combo')),
  country_code text,
  sector_slug text,
  created_at timestamptz not null default now(),
  unique (user_id, type, country_code, sector_slug)
);

create index idx_favorites_user on public.favorites (user_id);

-- 5. email_subscribers — newsletter signups
create table public.email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null check (source in ('footer', 'about', 'login')),
  subscribed_at timestamptz not null default now()
);

-- 6. anomaly_posts_log — X posting cooldown management
create table public.anomaly_posts_log (
  id uuid primary key default gen_random_uuid(),
  trigger_id text not null,                   -- T1-T5
  country_code text,
  fired_at timestamptz not null default now(),
  post_id text                                -- X post ID
);

create index idx_anomaly_log_cooldown
  on public.anomaly_posts_log (trigger_id, country_code, fired_at desc);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.emotion_snapshots enable row level security;
alter table public.sectors enable row level security;
alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.email_subscribers enable row level security;
alter table public.anomaly_posts_log enable row level security;

-- emotion_snapshots: public read
create policy "Anyone can read snapshots"
  on public.emotion_snapshots for select
  using (true);

-- sectors: public read
create policy "Anyone can read sectors"
  on public.sectors for select
  using (true);

-- profiles: owner read/update
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- favorites: owner CRUD
create policy "Users can read own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Users can insert own favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

-- email_subscribers: anyone can insert
create policy "Anyone can subscribe"
  on public.email_subscribers for insert
  with check (true);

-- anomaly_posts_log: no public access (service_role only)
-- (no policies = service_role access only with RLS enabled)

-- ============================================================
-- Trigger: auto-create profile on user signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
