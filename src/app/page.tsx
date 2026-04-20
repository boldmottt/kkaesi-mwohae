'use client'
import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/useProfile'
import { useWakeWindows } from '@/hooks/useWakeWindows'
import { WakeWindowCard } from '@/components/wake-window-card/WakeWindowCard'
import { getAgeInMonths, getAgeInDays } from '@/lib/utils/age'

function getTodayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function TodayPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()
  const { wakeWindows, loading: windowsLoading } = useWakeWindows(profile?.id)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
    })
  }, [router])

  useEffect(() => {
    if (!profileLoading && !profile) {
      router.push('/onboarding')
    }
  }, [profile, profileLoading, router])

  const today = useMemo(() => getTodayString(), [])

  if (profileLoading || windowsLoading) {
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">깨시뭐해</h1>
          <p className="text-sm text-gray-500">{profile.baby_name} · {ageMonths}개월</p>
        </div>
        <button
          onClick={() => router.push('/settings')}
          className="text-gray-400 text-sm"
        >
          설정
        </button>
      </div>

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
          />
        ))}
      </div>
    </main>
  )
}
