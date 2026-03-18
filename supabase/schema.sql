-- milk-pm database schema
-- Run this in your Supabase SQL Editor
--
-- CONFIGURATION OPTIONS:
--
-- Option 1: Dedicated schema (recommended for shared databases)
--   Set env: MILKPM_DB_SCHEMA=milkpm
--   Uncomment the "DEDICATED SCHEMA" section below
--
-- Option 2: Public schema with prefixed tables (default)
--   Set env: MILKPM_DB_SCHEMA=public (or leave unset)
--   Use the "PUBLIC SCHEMA" section below

-- Enable UUID extension
create extension if not exists "uuid-ossp";


-- ============================================================================
-- OPTION 1: DEDICATED SCHEMA (uncomment if using MILKPM_DB_SCHEMA=milkpm)
-- ============================================================================

-- create schema if not exists milkpm;
--
-- create table if not exists milkpm.project_configs (
--   id uuid primary key default uuid_generate_v4(),
--   user_id uuid references auth.users(id) on delete cascade not null,
--   slug text not null,
--   name text not null,
--   description text,
--   color text not null default 'blue',
--   url text,
--   convention text default 'milk-mcp',
--   lists jsonb not null,
--   created_at timestamptz default now(),
--   updated_at timestamptz default now(),
--   unique(user_id, slug)
-- );
--
-- alter table milkpm.project_configs enable row level security;
--
-- create policy "milkpm_anyone_can_view" on milkpm.project_configs for select using (true);
-- create policy "milkpm_users_insert_own" on milkpm.project_configs for insert with check (auth.uid() = user_id);
-- create policy "milkpm_users_update_own" on milkpm.project_configs for update using (auth.uid() = user_id);
-- create policy "milkpm_users_delete_own" on milkpm.project_configs for delete using (auth.uid() = user_id);
--
-- create index if not exists idx_milkpm_project_configs_user_id on milkpm.project_configs(user_id);
-- create index if not exists idx_milkpm_project_configs_slug on milkpm.project_configs(slug);


-- ============================================================================
-- OPTION 2: PUBLIC SCHEMA WITH PREFIX (default)
-- ============================================================================

create table if not exists milkpm_project_configs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  slug text not null,
  name text not null,
  description text,
  color text not null default 'blue',
  url text,
  convention text default 'milk-mcp',
  lists jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, slug)
);

alter table milkpm_project_configs enable row level security;

create policy "milkpm_anyone_can_view" on milkpm_project_configs for select using (true);
create policy "milkpm_users_insert_own" on milkpm_project_configs for insert with check (auth.uid() = user_id);
create policy "milkpm_users_update_own" on milkpm_project_configs for update using (auth.uid() = user_id);
create policy "milkpm_users_delete_own" on milkpm_project_configs for delete using (auth.uid() = user_id);

create index if not exists idx_milkpm_project_configs_user_id on milkpm_project_configs(user_id);
create index if not exists idx_milkpm_project_configs_slug on milkpm_project_configs(slug);


-- ============================================================================
-- SHARED: Trigger for updated_at (works for both options)
-- ============================================================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- For public schema option:
create trigger milkpm_project_configs_updated_at
  before update on milkpm_project_configs
  for each row
  execute function update_updated_at_column();

-- For dedicated schema option (uncomment if using):
-- create trigger project_configs_updated_at
--   before update on milkpm.project_configs
--   for each row
--   execute function update_updated_at_column();
