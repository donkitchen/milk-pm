-- Migration: Add categories, display order, and user preferences
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. Add new columns to project_configs
-- ============================================================================

-- For public schema (milkpm_project_configs)
ALTER TABLE milkpm_project_configs
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS display_order integer,
ADD COLUMN IF NOT EXISTS repo_url text;

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_milkpm_project_configs_display_order
ON milkpm_project_configs(user_id, display_order);

CREATE INDEX IF NOT EXISTS idx_milkpm_project_configs_category
ON milkpm_project_configs(user_id, category);

-- ============================================================================
-- 2. Create user_preferences table
-- ============================================================================

CREATE TABLE IF NOT EXISTS milkpm_user_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  sort_by text NOT NULL DEFAULT 'name',
  sort_direction text NOT NULL DEFAULT 'asc',
  show_empty_projects boolean NOT NULL DEFAULT true,
  default_project text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_sort_by CHECK (sort_by IN ('name', 'category', 'custom', 'color')),
  CONSTRAINT valid_sort_direction CHECK (sort_direction IN ('asc', 'desc'))
);

-- Enable RLS
ALTER TABLE milkpm_user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "milkpm_users_read_own_prefs"
ON milkpm_user_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "milkpm_users_insert_own_prefs"
ON milkpm_user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "milkpm_users_update_own_prefs"
ON milkpm_user_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_milkpm_user_preferences_user_id
ON milkpm_user_preferences(user_id);

-- Trigger for updated_at
CREATE TRIGGER milkpm_user_preferences_updated_at
  BEFORE UPDATE ON milkpm_user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- For dedicated schema (uncomment if using MILKPM_DB_SCHEMA=milkpm)
-- ============================================================================

-- ALTER TABLE milkpm.project_configs
-- ADD COLUMN IF NOT EXISTS category text,
-- ADD COLUMN IF NOT EXISTS display_order integer;

-- CREATE INDEX IF NOT EXISTS idx_project_configs_display_order
-- ON milkpm.project_configs(user_id, display_order);

-- CREATE INDEX IF NOT EXISTS idx_project_configs_category
-- ON milkpm.project_configs(user_id, category);

-- CREATE TABLE IF NOT EXISTS milkpm.user_preferences (
--   id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
--   user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
--   sort_by text NOT NULL DEFAULT 'name',
--   sort_direction text NOT NULL DEFAULT 'asc',
--   show_empty_projects boolean NOT NULL DEFAULT true,
--   default_project text,
--   created_at timestamptz DEFAULT now(),
--   updated_at timestamptz DEFAULT now(),
--   CONSTRAINT valid_sort_by CHECK (sort_by IN ('name', 'category', 'custom', 'color')),
--   CONSTRAINT valid_sort_direction CHECK (sort_direction IN ('asc', 'desc'))
-- );

-- ALTER TABLE milkpm.user_preferences ENABLE ROW LEVEL SECURITY;
-- ... (add policies as above)
