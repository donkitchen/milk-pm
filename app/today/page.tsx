import type { Metadata } from 'next'
import MyDayView from '../../components/MyDayView'

export const metadata: Metadata = {
  title: 'My Day',
  description: 'Tasks for today',
}

export default function TodayPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
      <MyDayView />
    </main>
  )
}
