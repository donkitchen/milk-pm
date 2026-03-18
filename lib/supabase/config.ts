// Database configuration
// Set MILKPM_DB_SCHEMA to use a dedicated schema (recommended for shared databases)
// Default: 'public' (uses milkpm_ prefix on tables)

export const DB_SCHEMA = process.env.MILKPM_DB_SCHEMA || 'public'

// Table name varies based on schema choice
// - Dedicated schema (e.g., 'milkpm'): uses 'project_configs'
// - Public schema: uses 'milkpm_project_configs' to avoid collisions
export const TABLE_PROJECT_CONFIGS =
  DB_SCHEMA === 'public' ? 'milkpm_project_configs' : 'project_configs'
