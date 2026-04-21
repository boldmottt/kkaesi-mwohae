'use client'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { useWakeWindows } from '@/hooks/useWakeWindows'
import { WakeWindowCard } from '@/components/wake-window-card/WakeWindowCard'
import { DailyChat } from '@/components/daily-chat/DailyChat'
import { getAgeInMonths, getAgeInDays } from '@/lib/utils/age'
import { Activity } from '@/lib/supabase/types'

function getTodayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatTodayLabel(): string {
  const DAY_LABELS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
  const d = new Date()
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAY_LABELS[d.getDay()]}`
}

export default function TodayPage() {
  const router = useRouter()
  const { profile, loading: profileLoading, isLoggedIn } = useProfile()
  const { wakeWindows, loading: windowsLoading } = useWakeWindows(profile?.id)
  const [activitiesByWindow, setActivitiesByWindow] = useState<Record<number, Activity[]>>({})

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

  const today = useMemo(() => getTodayString(), [])
  const todayLabel = useMemo(() => formatTodayLabel(), [])

  const handleScheduleUpdate = useCallback((windowIndex: number, activities: Activity[]) => {
    setActivitiesByWindow(prev => ({
      ...prev,
      [windowIndex]: activities,
    }))
  }, [])

  const handleActivitiesLoaded = useCallback((windowIndex: number, activities: Activity[]) => {
    setActivitiesByWindow(prev => {
      if (JSON.stringify(prev[windowIndex]) === JSON.stringify(activities)) return prev
      return { ...prev, [windowIndex]: activities }
    })
  }, [])

  if (isLoggedIn === null || profileLoading || windowsLoading) {
    return (
      <main className="min-h-screen p-6">
        <div className="h-8 bg-amber-200 rounded animate-pulse mb-8 w-32" />
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      </main>
    )
  }

  if (!profile) return null

  const birthDate = new Date(profile.birth_date)
  const ageMonths = getAgeInMonths(birthDate)
  const ageDays = getAgeInDays(birthDate)

  return (
    <main className="min-h-screen p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">깨시뭐해</h1>
          <p className="text-sm text-gray-500 mt-0.5">{profile.baby_name} · {ageMonths}개월</p>
          <p className="text-sm text-gray-400 mt-0.5">{todayLabel} · D+{ageDays}</p>
        </div>
        <button
          onClick={() => router.push('/settings')}
          className="text-gray-400 text-sm mt-1"
        >
          설정
        </button>
      </div>

      <DailyChat
        profileId={profile.id}
        ageMonths={ageMonths}
        ageDays={ageDays}
        date={today}
        wakeWindows={wakeWindows}
        currentActivitiesByWindow={activitiesByWindow}
        onScheduleUpdate={handleScheduleUpdate}
      />

      <div className="flex flex-col gap-4">
        {wakeWindows.map((ww, index) => (
          <WakeWindowCard
            key={ww.id}
            windowIndex={index}
            totalWindows={wakeWindows.length}
            wakeWindow={ww}
            profileId={profile.id}
            ageMonths={ageMonths}
            ageDays={ageDays}
            date={today}
            overrideActivities={activitiesByWindow[index]}
            onActivitiesLoaded={handleActivitiesLoaded}
          />
        ))}
      </div>
    </main>
  )
}
