'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { useWakeWindows } from '@/hooks/useWakeWindows'
import { WakeWindowCard } from '@/components/wake-window-card/WakeWindowCard'
import { WeekTabs } from '@/components/week/WeekTabs'
import { getAgeInMonths } from '@/lib/utils/age'

function getDefaultDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export default function WeekPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(getDefaultDate)
  const { profile, loading: profileLoading } = useProfile()
  const { wakeWindows, loading: windowsLoading } = useWakeWindows(profile?.id)

  if (profileLoading || windowsLoading) {
    return (
      <main className="min-h-screen p-6">
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </main>
    )
  }

  if (!profile) {
    router.push('/login')
    return null
  }

  const ageMonths = getAgeInMonths(new Date(profile.birth_date))

  return (
    <main className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">이번 주 깨시</h1>
        <button
          onClick={() => router.push('/')}
          className="text-gray-400 text-sm"
        >
          오늘로
        </button>
      </div>

      <WeekTabs selectedDate={selectedDate} onSelect={setSelectedDate} />

      <div className="flex flex-col gap-4 mt-4">
        {wakeWindows.map((ww, index) => (
          <WakeWindowCard
            key={`${selectedDate}-${index}`}
            windowIndex={index}
            wakeWindow={ww}
            profileId={profile.id}
            ageMonths={ageMonths}
            date={selectedDate}
          />
        ))}
      </div>
    </main>
  )
}
