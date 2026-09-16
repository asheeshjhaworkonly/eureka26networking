create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null unique,
  data jsonb not null,
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_consent check (data->>'consent' = 'true'),
  constraint profile_word_limit check (array_length(regexp_split_to_array(trim(data->>'description'), '\s+'), 1) <= 50)
);
-- Teammates may share a Eureka application ID; only the account identity is unique.
create index if not exists profiles_eureka_id_lookup on public.profiles (lower(trim(data->>'eurekaId')));
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;

-- Server verifies Clerk sessions before using the service role. No browser database access.
create table if not exists public.purchases (
  user_id text primary key,
  status text not null check (status in ('pending','paid')),
  razorpay_payment_id text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.purchases enable row level security;
revoke all on public.purchases from anon, authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('founder-photos','founder-photos',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
