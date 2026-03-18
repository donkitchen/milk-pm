<p align="center">
  <a href="https://milk.tools">
    <img src="public/milktools-mascot.jpg" alt="milk.tools" width="80" />
  </a>
</p>

<h1 align="center">milk-pm</h1>

<p align="center">
  <strong>Your projects, remembered.</strong>
</p>

<p align="center">
  <a href="https://milk.tools/milk-pm">Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#deploy">Deploy</a>
</p>

---

## What is this?

You know how Remember The Milk is great for personal tasks but feels a bit... personal?

**milk-pm** turns RTM into an actual project management system. Multiple projects. Priority views. Due date tracking. Velocity charts. The whole thing.

Is this over-engineered? Maybe. Does it work surprisingly well? Also yes.

---

## Features

### The Dashboard Stuff
- **Project Overview** — All your projects. Task counts. Bug badges. Very satisfying.
- **Due Date Sections** — Overdue (yikes), due today (okay), due this week (you're fine)
- **Global Search** — Find tasks. Fast. With debouncing. Because we're fancy.
- **Activity Feed** — See what changed. Feel productive.
- **Quick Add** — Add tasks without leaving the dashboard. Revolutionary.

### The Project Stuff
- **Five List Types** — TODO, Backlog, Bugs, Decisions, Context. Pick your poison.
- **Priority Filtering** — P1s only? Just bugs? We got you.
- **Clickable Everything** — Click a task. See the details. Edit things. Wild.

### The Editing Stuff
- **Full Edit Mode** — Name, priority, due date, estimate, URL, tags. The works.
- **Complete/Uncomplete** — One click. Very satisfying. Click it again if you regret it.
- **Notes** — Add notes. Delete notes. Notes notes notes.
- **Real-time Sync** — Changes go to RTM instantly. Like magic, but real.

### The Fancy Stuff
- **Velocity Charts** — Watch your task counts change over time. Feel things.
- **Keyboard Shortcuts** — `/` to search, `q` to quick add, `?` for help. You're welcome.
- **Dark Mode** — Because it's 2024. Or 2025. Whatever year it is.

---

## Quick Start

### You'll Need

- A [Remember The Milk](https://www.rememberthemilk.com) account (free works)
- RTM API credentials ([get them here](https://www.rememberthemilk.com/services/api/keys.rtm))
- Node.js 18+ (sorry, we're modern)

### 1. Clone it

```bash
git clone https://github.com/donkitchen/milk-pm.git
cd milk-pm
npm install
```

### 2. Configure it

```bash
cp .env.example .env.local
```

Add your RTM stuff:

```env
RTM_API_KEY=your_key_here
RTM_SHARED_SECRET=your_secret_here
```

### 3. Authenticate

```bash
npm run auth
```

Browser opens. You click approve. Token gets saved. Easy.

> **Already using milk-mcp?** Just copy from `~/.config/milk-mcp/config`. Skip this step. Live your life.

### 4. Set up projects

Edit `projects.json`:

```json
{
  "projects": [
    {
      "slug": "world-domination",
      "name": "World Domination",
      "description": "Phase 1: Make a todo app",
      "color": "purple",
      "lists": {
        "todo":      "World Domination - TODO",
        "backlog":   "World Domination - Backlog",
        "bugs":      "World Domination - Bugs",
        "decisions": "World Domination - Decisions",
        "context":   "World Domination - Context"
      }
    }
  ]
}
```

**Colors:** `blue` `teal` `purple` `amber` `green` `red` `gray`

### 5. Run it

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000). Bask in glory.

---

## Deploy

### Vercel (easy mode)

```bash
npx vercel
```

Add env vars. Done. That's it. Go home.

| Variable | What it is |
|---|---|
| `RTM_API_KEY` | Your API key |
| `RTM_SHARED_SECRET` | Your secret |
| `RTM_AUTH_TOKEN` | The token from step 3 |

---

## Keyboard Shortcuts

Because clicking is for people with time.

| Key | What it does |
|-----|--------------|
| `/` | Search |
| `q` | Quick add |
| `g` `h` | Go to history |
| `?` | Help (it's this, but in a modal) |
| `Esc` | Close stuff |

---

## Using with milk-mcp

[milk-mcp](https://github.com/donkitchen/milk-mcp) gives Claude Code persistent memory through RTM. It creates lists like:

```
CC: project-name - TODO
CC: project-name - Backlog
CC: project-name - Bugs
CC: project-name - Decisions
CC: project-name - Context
```

milk-pm works with these out of the box. Same credentials. Zero setup. Maximum laziness achieved.

---

## Tech Stack

For the curious:

- **Next.js 15** — App Router, because we live in the future
- **Tailwind** — CSS but make it utility
- **Recharts** — Charts that actually look good
- **Supabase** — Auth + database + magic
- **Vercel** — Deploy button go brrrr

---

## The milk.tools Universe

milk-pm is part of [milk.tools](https://milk.tools) — a collection of productivity tools built on RTM.

| Tool | What it does |
|------|-------------|
| **milk-pm** | This. You're reading it. |
| **milk-mcp** | Claude Code + RTM. Memory for your AI. |

More coming. Probably. Maybe. We'll see.

---

## License

MIT — Do whatever. Credit appreciated but not required. We're chill.

---

<p align="center">
  <a href="https://milk.tools">
    <img src="public/milktools-mascot.jpg" alt="milk.tools" width="40" />
    <img src="public/milktools-banner.jpg" alt="milk.tools" width="120" />
  </a>
</p>

<p align="center">
  <em>probably unnecessary. definitely useful.</em><br>
  <a href="https://milk.tools">milk.tools</a>
</p>
