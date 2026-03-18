export interface ProjectConfig {
  id: string
  user_id: string
  slug: string
  name: string
  description: string | null
  color: string
  url: string | null
  convention: string
  category: string | null
  display_order: number | null
  lists: {
    todo: string
    backlog: string
    bugs: string
    decisions: string
    context: string
  }
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  sort_by: 'name' | 'category' | 'custom' | 'color'
  sort_direction: 'asc' | 'desc'
  show_empty_projects: boolean
  default_project: string | null
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      project_configs: {
        Row: ProjectConfig
        Insert: Omit<ProjectConfig, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProjectConfig, 'id' | 'user_id' | 'created_at'>>
      }
      user_preferences: {
        Row: UserPreferences
        Insert: Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at'>>
      }
    }
  }
}
