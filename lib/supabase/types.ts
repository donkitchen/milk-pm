export interface ProjectConfig {
  id: string
  user_id: string
  slug: string
  name: string
  description: string | null
  color: string
  url: string | null
  convention: string
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

export interface Database {
  public: {
    Tables: {
      project_configs: {
        Row: ProjectConfig
        Insert: Omit<ProjectConfig, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProjectConfig, 'id' | 'user_id' | 'created_at'>>
      }
    }
  }
}
