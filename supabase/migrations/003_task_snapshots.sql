-- Migration: Add task snapshots for trends/velocity tracking
-- Stores daily snapshots of task counts per project

-- ============================================================================
-- For milkpm schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS milkpm.task_snapshots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_slug text NOT NULL,
  snapshot_date date NOT NULL,
  todo_count integer DEFAULT 0,
  backlog_count integer DEFAULT 0,
  bugs_count integer DEFAULT 0,
  completed_today integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),

  CONSTRAINT unique_snapshot UNIQUE(user_id, project_slug, snapshot_date)
);

-- Enable RLS
ALTER TABLE milkpm.task_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY task_snapshots_select
ON milkpm.task_snapshots FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY task_snapshots_insert
ON milkpm.task_snapshots FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY task_snapshots_update
ON milkpm.task_snapshots FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY task_snapshots_delete
ON milkpm.task_snapshots FOR DELETE
USING (auth.uid() = user_id);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_task_snapshots_user_date
ON milkpm.task_snapshots(user_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_task_snapshots_user_project
ON milkpm.task_snapshots(user_id, project_slug, snapshot_date DESC);
