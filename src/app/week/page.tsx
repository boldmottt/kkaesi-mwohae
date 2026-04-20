'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { useWakeWindows } from '@/hooks/useWakeWindows'
import { WakeWindowCard } from '@/components/wake-window-card/WakeWindowCard'
import { WeekTabs } from '@/components/week/WeekTabs'
import { getAgeInMonths, getAgeInDays } from '@/lib/utils/age'

function getDefaultDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export default function WeekPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(getDefaultDate)
  const { profile, loading: profileLoading, isLoggedIn } = useProfile()
  const { wakeWindows, loading: windowsLoading } = useWakeWindows(profile?.id)

  useEffect(() => {
    if (isLoggedIn === false) {
      router.push('/login')
    }
  }, [isLoggedIn, router])

  useEffect(() => {
    if (isLoggedIn === true && !profileLoading && !profile) {
      router.push('/onboarding')
    }
  }, [isLoggedIn, profile, profileLoading, router])

  if (isLoggedIn === null || profileLoading || windowsLoading) {
    return (
      <main className="min-h-screen p-6">
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </main>
    )
  }

  if (!profile) return null

  const birthDate = new Date(profile.birth_date)
  const ageMonths = getAgeInMonths(birthDate, new Date(selectedDate))
  const ageDays = getAgeInDays(birthDate, new Date(selectedDate))

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
            totalWindows={wakeWindows.length}
            wakeWindow={ww}
            profileId={profile.id}
            ageMonths={ageMonths}
            ageDays={ageDays}
            date={selectedDate}
          />
        ))}
      </div>
    </main>
  )
}
