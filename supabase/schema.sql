-- Run this once in your Supabase project's SQL editor.
-- Dashboard -> SQL Editor -> New query -> paste this whole file -> Run.

create extension if not exists "pgcrypto";

-- Drop old table if upgrading from v1
drop table if exists public.places cascade;

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  country_code text not null,
  country_name text not null,
  continent text,
  state_name text,
  city_name text not null,
  latitude double precision,
  longitude double precision,
  visited_on date,
  notes text,
  rating int check (rating >= 1 and rating <= 5),
  status text not null default 'visited' check (status in ('visited', 'wishlist')),
  trip_name text,
  created_at timestamptz not null default now()
);

create index if not exists places_user_id_idx on public.places (user_id);
create index if not exists places_status_idx on public.places (user_id, status);

-- Allow same city multiple times for different trips
create unique index if not exists places_unique_per_user
  on public.places (user_id, country_code, coalesce(state_name, ''), city_name, coalesce(trip_name, ''));

alter table public.places enable row level security;

drop policy if exists "Individuals can view their own places" on public.places;
create policy "Individuals can view their own places"
  on public.places for select
  using (auth.uid() = user_id);

drop policy if exists "Individuals can insert their own places" on public.places;
create policy "Individuals can insert their own places"
  on public.places for insert
  with check (auth.uid() = user_id);

drop policy if exists "Individuals can update their own places" on public.places;
create policy "Individuals can update their own places"
  on public.places for update
  using (auth.uid() = user_id);

drop policy if exists "Individuals can delete their own places" on public.places;
create policy "Individuals can delete their own places"
  on public.places for delete
  using (auth.uid() = user_id);
