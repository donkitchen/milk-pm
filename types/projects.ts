import { ListRole } from '../lib/projects'

export const LIST_ROLE_META: Record<
  ListRole,
  { label: string; emoji: string; color: string }
> = {
  todo:      { label: 'TODO',      emoji: '✓',  color: 'blue'   },
  backlog:   { label: 'Backlog',   emoji: '⏸',  color: 'gray'   },
  bugs:      { label: 'Bugs',      emoji: '🐛', color: 'red'    },
  decisions: { label: 'Decisions', emoji: '🏛', color: 'purple' },
  context:   { label: 'Context',   emoji: '🔁', color: 'teal'   },
}
