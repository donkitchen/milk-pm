<p align="center">
  <img src="public/milktools-mascot.jpg" alt="milk.tools mascot" width="120" />
</p>

<h1 align="center">milk-pm</h1>

<p align="center">
  <strong>A powerful project management dashboard built on Remember The Milk</strong>
</p>

<p align="center">
  <a href="https://milk.tools/milk-pm">Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#deploy">Deploy</a>
</p>

<p align="center">
  <img src="public/milktools-banner.jpg" alt="milk.tools" width="300" />
</p>

<p align="center">
  Part of the <a href="https://milk.tools"><strong>milk.tools</strong></a> suite
</p>

---

## Why milk-pm?

**Remember The Milk is great for personal tasks. But what if you need more?**

milk-pm transforms RTM into a full-featured project management system — without losing the simplicity you love. Group tasks by project, track priorities, monitor velocity, and manage everything from a beautiful dashboard.

Built for developers, PMs, and teams who want the power of RTM with a project management layer on top.

---

## Features

### Dashboard
- **Project Overview** — See all your projects at a glance with task counts and bug badges
- **Due Date Sections** — Overdue, due today, and due this week — always visible
- **Global Search** — Find any task instantly with debounced search
- **Activity Feed** — Track recent task changes across all projects
- **Quick Add** — Add tasks from anywhere with smart parsing

### Project Detail
- **Five List Types** — TODO, Backlog, Bugs, Decisions, and Context
- **Priority Filtering** — Filter by P1/P2/P3 with visual priority indicators
- **Sorting** — Sort by priority, due date, or name
- **Clickable Tasks** — View full details for any task

### Task Editing
- **Full Edit Mode** — Name, priority, due date, estimate, URL, and tags
- **Complete/Uncomplete** — Toggle completion status with one click
- **Notes** — Add and delete notes directly from the modal
- **Real-time Sync** — All changes sync back to RTM instantly

### Trends & Analytics
- **Velocity Tracking** — See how your task counts change over time
- **Stacked Charts** — Visualize TODO, Backlog, and Bugs trends
- **Project Filtering** — Focus on one project or see everything

### Power User Features
- **Keyboard Shortcuts** — Vim-style navigation (`/` search, `q` quick add, `?` help)
- **Dark Mode** — Full dark mode support
- **Mobile Ready** — Responsive design for all devices

---

## Quick Start

### Prerequisites

- [Remember The Milk](https://www.rememberthemilk.com) account (free tier works)
- RTM API credentials from [rememberthemilk.com/services/api/keys.rtm](https://www.rememberthemilk.com/services/api/keys.rtm)
- Node.js 18+

### 1. Clone and install

```bash
git clone https://github.com/donkitchen/milk-pm.git
cd milk-pm
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
RTM_API_KEY=your_api_key_here
RTM_SHARED_SECRET=your_shared_secret_here
```

### 3. Authenticate with RTM

```bash
npm run auth
```

This opens a browser for authorization and writes your `RTM_AUTH_TOKEN` to `.env.local`.

> **Using milk-mcp?** Copy your credentials from `~/.config/milk-mcp/config` and skip this step.

### 4. Configure projects

Edit `projects.json`:

```json
{
  "projects": [
    {
      "slug": "my-project",
      "name": "My Project",
      "description": "Build something amazing",
      "color": "blue",
      "url": "https://github.com/you/my-project",
      "lists": {
        "todo":      "My Project - TODO",
        "backlog":   "My Project - Backlog",
        "bugs":      "My Project - Bugs",
        "decisions": "My Project - Decisions",
        "context":   "My Project - Context"
      }
    }
  ]
}
```

**Available colors:** `blue` `teal` `purple` `amber` `green` `red` `gray`

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy

### Vercel (Recommended)

```bash
npx vercel
```

Add environment variables in Vercel:

| Variable | Value |
|---|---|
| `RTM_API_KEY` | Your RTM API key |
| `RTM_SHARED_SECRET` | Your RTM shared secret |
| `RTM_AUTH_TOKEN` | Token from `npm run auth` |

---

## Using with milk-mcp

[milk-mcp](https://github.com/donkitchen/milk-mcp) is an MCP server that gives Claude Code persistent memory through RTM. It creates five lists per project:

```
CC: [project-name] - TODO
CC: [project-name] - Backlog
CC: [project-name] - Bugs
CC: [project-name] - Decisions
CC: [project-name] - Context
```

milk-pm works seamlessly with this convention. If you're using milk-mcp, your credentials are already set up — just copy them from `~/.config/milk-mcp/config`.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search |
| `q` | Quick add task |
| `g` `h` | Go to history |
| `?` | Show help |
| `Esc` | Close modal / cancel |

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Database:** Supabase (for trends/snapshots)
- **Auth:** Supabase Auth with GitHub
- **Deployment:** Vercel

---

## The milk.tools Suite

milk-pm is part of [milk.tools](https://milk.tools) — a collection of productivity tools built on Remember The Milk.

| Tool | Description |
|------|-------------|
| **milk-pm** | Project management dashboard |
| **milk-mcp** | MCP server for Claude Code |

---

## License

MIT

---

<p align="center">
  <a href="https://milk.tools">
    <img src="public/milktools-mascot.jpg" alt="milk.tools" width="60" />
  </a>
</p>

<p align="center">
  Made with RTM by <a href="https://milk.tools">milk.tools</a>
</p>
