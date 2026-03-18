-- milk-pm database schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Project configs table
create table if not exists project_configs (
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

  -- Each user can only have one config per slug
  unique(user_id, slug)
);

-- Enable Row Level Security
alter table project_configs enable row level security;

-- Policy: Users can read all project configs (public dashboard)
create policy "Anyone can view project configs"
  on project_configs for select
  using (true);

-- Policy: Users can insert their own project configs
create policy "Users can insert own project configs"
  on project_configs for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own project configs
create policy "Users can update own project configs"
  on project_configs for update
  using (auth.uid() = user_id);

-- Policy: Users can delete their own project configs
create policy "Users can delete own project configs"
  on project_configs for delete
  using (auth.uid() = user_id);

-- Index for faster lookups
create index if not exists idx_project_configs_user_id on project_configs(user_id);
create index if not exists idx_project_configs_slug on project_configs(slug);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for updated_at
create trigger update_project_configs_updated_at
  before update on project_configs
  for each row
  execute function update_updated_at_column();
