import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'milk-pm',
  description: 'A configurable RTM project dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
