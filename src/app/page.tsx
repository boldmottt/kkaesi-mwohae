'use client'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { useWakeWindows } from '@/hooks/useWakeWindows'
import { WakeWindowCard } from '@/components/wake-window-card/WakeWindowCard'
import { SleepCard } from '@/components/sleep-card/SleepCard'
import { DailyChat } from '@/components/daily-chat/DailyChat'
import { getAgeInMonths, getAgeInDays } from '@/lib/utils/age'
import { Activity, WakeWindow } from '@/lib/supabase/types'

function getTodayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatTodayLabel(): string {
  const DAY_LABELS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
  const d = new Date()
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAY_LABELS[d.getDay()]}`
}

function applyStartTimeOverrides(
  wakeWindows: WakeWindow[],
  startOverrides: Record<number, string>
): WakeWindow[] {
  return wakeWindows.map((ww, index) => {
    const override = startOverrides[index]
    return override ? { ...ww, start_time: override } : ww
  })
}

export default function TodayPage() {
  const router = useRouter()
  const { profile, loading: profileLoading, isLoggedIn } = useProfile()
  const { wakeWindows: rawWakeWindows, loading: windowsLoading } = useWakeWindows(profile?.id)
  const [activitiesByWindow, setActivitiesByWindow] = useState<Record<number, Activity[]>>({})
  // napIndex N의 sleepEnd → wakeWindows[N].start_time 오버라이드
  const [startOverrides, setStartOverrides] = useState<Record<number, string>>({})
  // napIndex N의 sleepStart → wakeWindows[N-1]의 실제 종료 시간 표시
  const [napSleepStarts, setNapSleepStarts] = useState<Record<number, string>>({})

  useEffect(() => {
    if (isLoggedIn === false) router.push('/login')
  }, [isLoggedIn, router])

  useEffect(() => {
    if (isLoggedIn === true && !profileLoading && !profile) router.push('/onboarding')
  }, [isLoggedIn, profile, profileLoading, router])

  const today = useMemo(() => getTodayString(), [])
  const todayLabel = useMemo(() => formatTodayLabel(), [])

  const handleSleepChanged = useCallback((napIndex: number, sleepStart: string | null, sleepEnd: string | null) => {
    // sleepEnd → 다음 깨시(index=napIndex)의 start_time
    setStartOverrides(prev => {
      const next = { ...prev }
      if (sleepEnd) next[napIndex] = sleepEnd
      else delete next[napIndex]
      return next
    })
    // sleepStart (낮잠) → 이전 깨시(index=napIndex-1)의 실제 종료 시간
    setNapSleepStarts(prev => {
      const next = { ...prev }
      if (sleepStart && napIndex > 0) next[napIndex] = sleepStart
      else delete next[napIndex]
      return next
    })
  }, [])

  const wakeWindows = useMemo(
    () => applyStartTimeOverrides(rawWakeWindows, startOverrides),
    [rawWakeWindows, startOverrides]
  )

  const handleScheduleUpdate = useCallback((windowIndex: number, activities: Activity[]) => {
    setActivitiesByWindow(prev => ({ ...prev, [windowIndex]: activities }))
  }, [])

  const handleActivitiesLoaded = useCallback((windowIndex: number, activities: Activity[]) => {
    setActivitiesByWindow(prev => {
      if (JSON.stringify(prev[windowIndex]) === JSON.stringify(activities)) return prev
      return { ...prev, [windowIndex]: activities }
    })
  }, [])

  useEffect(() => {
    if (!profile?.id || !today) return
    async function loadSleepLogs() {
      try {
        const res = await fetch(`/api/sleep-logs?profileId=${profile!.id}&date=${today}`)
        if (!res.ok) return
        const data = await res.json()
        const starts: Record<number, string> = {}
        const napStarts: Record<number, string> = {}
        for (const log of data.sleepLogs ?? []) {
          if (log.sleep_end) starts[log.nap_index] = log.sleep_end
          if (log.sleep_start && log.nap_index > 0) napStarts[log.nap_index] = log.sleep_start
        }
        if (Object.keys(starts).length > 0) setStartOverrides(starts)
        if (Object.keys(napStarts).length > 0) setNapSleepStarts(napStarts)
      } catch {
        // 실패 시 무시
      }
    }
    loadSleepLogs()
  }, [profile?.id, today])

  if (isLoggedIn === null || profileLoading) {
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

      <div className="flex flex-col gap-3">
        {windowsLoading && wakeWindows.length === 0 && (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-white rounded-2xl animate-pulse" />
            ))}
          </>
        )}
        {wakeWindows.map((ww, index) => (
          <div key={ww.id} className="flex flex-col gap-3">
            <SleepCard
              profileId={profile.id}
              date={today}
              napIndex={index}
              totalWindows={wakeWindows.length}
              onSleepChanged={handleSleepChanged}
            />

            <WakeWindowCard
              windowIndex={index}
              totalWindows={wakeWindows.length}
              wakeWindow={ww}
              profileId={profile.id}
              ageMonths={ageMonths}
              ageDays={ageDays}
              date={today}
              overrideActivities={activitiesByWindow[index]}
              onActivitiesLoaded={handleActivitiesLoaded}
              actualEndTime={napSleepStarts[index + 1]}
            />

            {index === wakeWindows.length - 1 && (
              <SleepCard
                profileId={profile.id}
                date={today}
                napIndex={wakeWindows.length}
                totalWindows={wakeWindows.length}
                onSleepChanged={handleSleepChanged}
              />
            )}
          </div>
        ))}
      </div>
    </main>
  )
}
