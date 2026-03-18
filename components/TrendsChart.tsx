'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'

interface Snapshot {
  id: string
  project_slug: string
  snapshot_date: string
  todo_count: number
  backlog_count: number
  bugs_count: number
  completed_today: number
}

interface Props {
  snapshots: Snapshot[]
  projectSlug?: string
  chartType?: 'line' | 'area'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function TrendsChart({ snapshots, projectSlug, chartType = 'area' }: Props) {
  // Group snapshots by date for aggregate view, or use directly for single project
  const chartData = projectSlug
    ? snapshots
        .filter((s) => s.project_slug === projectSlug)
        .map((s) => ({
          date: formatDate(s.snapshot_date),
          rawDate: s.snapshot_date,
          todo: s.todo_count,
          backlog: s.backlog_count,
          bugs: s.bugs_count,
          total: s.todo_count + s.backlog_count + s.bugs_count,
        }))
    : aggregateByDate(snapshots)

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">
          No snapshot data available. Create your first snapshot to start tracking trends.
        </p>
      </div>
    )
  }

  const ChartComponent = chartType === 'area' ? AreaChart : LineChart

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
          <XAxis
            dataKey="date"
            tick={{ fill: 'currentColor', fontSize: 12 }}
            className="text-gray-500"
          />
          <YAxis
            tick={{ fill: 'currentColor', fontSize: 12 }}
            className="text-gray-500"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg, #fff)',
              border: '1px solid var(--tooltip-border, #e5e7eb)',
              borderRadius: '8px',
            }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Legend />
          {chartType === 'area' ? (
            <>
              <Area
                type="monotone"
                dataKey="todo"
                name="TODO"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="backlog"
                name="Backlog"
                stackId="1"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="bugs"
                name="Bugs"
                stackId="1"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.6}
              />
            </>
          ) : (
            <>
              <Line
                type="monotone"
                dataKey="todo"
                name="TODO"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="backlog"
                name="Backlog"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="bugs"
                name="Bugs"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="total"
                name="Total"
                stroke="#6b7280"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3 }}
              />
            </>
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  )
}

function aggregateByDate(snapshots: Snapshot[]) {
  const byDate = new Map<string, { todo: number; backlog: number; bugs: number }>()

  for (const s of snapshots) {
    const existing = byDate.get(s.snapshot_date) ?? { todo: 0, backlog: 0, bugs: 0 }
    byDate.set(s.snapshot_date, {
      todo: existing.todo + s.todo_count,
      backlog: existing.backlog + s.backlog_count,
      bugs: existing.bugs + s.bugs_count,
    })
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({
      date: formatDate(date),
      rawDate: date,
      ...counts,
      total: counts.todo + counts.backlog + counts.bugs,
    }))
}
