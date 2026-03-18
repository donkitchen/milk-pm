import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { getLists } from '../../../lib/rtm'
import { ProjectConfig } from '../../../lib/projects'

const PROJECTS_FILE = path.join(process.cwd(), 'projects.json')

// Read projects.json directly (not cached import)
async function readProjectsFile(): Promise<ProjectConfig[]> {
  try {
    const content = await fs.readFile(PROJECTS_FILE, 'utf-8')
    const data = JSON.parse(content)
    return data.projects ?? []
  } catch {
    return []
  }
}

export interface DiscoveredProject {
  slug: string
  name: string
  lists: {
    todo: string
    backlog: string
    bugs: string
    decisions: string
    context: string
  }
  enabled: boolean
  config: ProjectConfig | null
}

// GET: Discover all milk-mcp projects from RTM and merge with projects.json
export async function GET() {
  try {
    const [rtmLists, existingConfigs] = await Promise.all([
      getLists(),
      readProjectsFile(),
    ])

    // Find all lists matching "CC: * - TODO" pattern
    const todoLists = rtmLists.filter((l) =>
      /^CC:\s*.+\s*-\s*TODO$/i.test(l.name)
    )

    // Extract project names and build discovered projects
    const discovered: DiscoveredProject[] = todoLists.map((todoList) => {
      // Extract project name: "CC: my-app - TODO" -> "my-app"
      const match = todoList.name.match(/^CC:\s*(.+?)\s*-\s*TODO$/i)
      const projectName = match?.[1]?.trim() ?? todoList.name
      const slug = projectName.toLowerCase().replace(/\s+/g, '-')

      // Check if this project is already in projects.json
      const existing = existingConfigs.find((c) => c.slug === slug)

      return {
        slug,
        name: projectName,
        lists: {
          todo: `CC: ${projectName} - TODO`,
          backlog: `CC: ${projectName} - Backlog`,
          bugs: `CC: ${projectName} - Bugs`,
          decisions: `CC: ${projectName} - Decisions`,
          context: `CC: ${projectName} - Context`,
        },
        enabled: !!existing,
        config: existing ?? null,
      }
    })

    // Sort: enabled first, then alphabetically
    discovered.sort((a, b) => {
      if (a.enabled !== b.enabled) return a.enabled ? -1 : 1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({ projects: discovered })
  } catch (error) {
    console.error('Failed to discover projects:', error)
    return NextResponse.json(
      { error: 'Failed to discover projects' },
      { status: 500 }
    )
  }
}

// POST: Update projects.json
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projects } = body as { projects: ProjectConfig[] }

    if (!Array.isArray(projects)) {
      return NextResponse.json(
        { error: 'Invalid projects array' },
        { status: 400 }
      )
    }

    // Write to projects.json
    const content = JSON.stringify({ projects }, null, 2) + '\n'
    await fs.writeFile(PROJECTS_FILE, content, 'utf-8')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save projects:', error)
    return NextResponse.json(
      { error: 'Failed to save projects' },
      { status: 500 }
    )
  }
}
