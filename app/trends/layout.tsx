import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trends',
  description: 'Track task velocity and project trends over time',
}

export default function TrendsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
