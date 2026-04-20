'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/useProfile'
import { useWakeWindows } from '@/hooks/useWakeWindows'
import { WakeWindowSettings, WakeWindowDraft } from '@/components/settings/WakeWindowSettings'
import { BabyTimeImport } from '@/components/settings/BabyTimeImport'

export default function SettingsPage() {
  const router = useRouter()
  const { profile } = useProfile()
  const { wakeWindows } = useWakeWindows(profile?.id)
  const [windows, setWindows] = useState<WakeWindowDraft[]>([])
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (wakeWindows.length > 0) {
      setWindows(wakeWindows.map(w => ({
        duration_minutes: w.duration_minutes,
        start_time: w.start_time ?? '',
        routines: w.routines ?? '',
      })))
    }
  }, [wakeWindows])

  async function handleSaveWindows() {
    if (!profile || windows.length === 0) return
    setSaving(true)
    setSaveSuccess(false)

    const supabase = createClient()

    await supabase.from('wake_windows').delete().eq('profile_id', profile.id)
    await supabase.from('wake_windows').insert(
      windows.map((w, i) => ({
        profile_id: profile.id,
        window_index: i,
        duration_minutes: w.duration_minutes,
        start_time: w.start_time || null,
        routines: w.routines || null,
      }))
    )

    setSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  async function handleCreateInvite() {
    if (!profile) return
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: profile.id }),
    })
    const data = await res.json()
    setInviteUrl(data.inviteUrl)
    try {
      await navigator.clipboard.writeText(data.inviteUrl)
    } catch {}
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (windows.length === 0 && wakeWindows.length === 0) {
    return (
      <main className="min-h-screen p-6">
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-6 pb-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">설정</h1>
        <button onClick={() => router.push('/')} className="text-gray-400 text-sm">
          닫기
        </button>
      </div>

      {profile && (
        <div className="bg-white rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-500 mb-1">아기</p>
          <p className="font-semibold">{profile.baby_name}</p>
        </div>
      )}

      <section className="mb-8">
        <h2 className="font-semibold mb-3">깨시 설정</h2>
        <WakeWindowSettings value={windows} onChange={setWindows} />
        <button
          onClick={handleSaveWindows}
          disabled={saving}
          className="mt-4 w-full bg-amber-400 text-white rounded-xl py-3 font-semibold disabled:opacity-60"
        >
          {saving ? '저장 중...' : saveSuccess ? '저장됨 ✓' : '저장'}
        </button>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold mb-3">BabyTime 가져오기</h2>
        <p className="text-sm text-gray-500 mb-3">
          BabyTime 내보내기 파일(CSV)로 깨시 설정을 자동으로 채울 수 있어요.
        </p>
        <BabyTimeImport onSuggestion={(count) => {
          const defaults: Record<number, number[]> = {
            1: [180],
            2: [90, 180],
            3: [30, 90, 180],
            4: [30, 60, 90, 120],
            5: [30, 45, 60, 90, 120],
          }
          const durations = defaults[count] ?? Array(count).fill(90)
          setWindows(durations.map(d => ({ duration_minutes: d, start_time: '', routines: '' })))
        }} />
      </section>

      <section className="mb-8">
        <h2 className="font-semibold mb-3">배우자 공유</h2>
        <p className="text-sm text-gray-500 mb-3">
          초대 링크를 공유하면 배우자도 같은 깨시 스케줄을 볼 수 있어요.
        </p>
        <button
          onClick={handleCreateInvite}
          className="w-full border border-amber-400 text-amber-500 rounded-xl py-3 font-semibold"
        >
          초대 링크 생성 + 복사
        </button>
        {inviteUrl && (
          <p className="text-xs text-green-600 mt-2">링크가 클립보드에 복사됐어요!</p>
        )}
      </section>

      <button
        onClick={handleLogout}
        className="text-gray-400 text-sm w-full text-center py-2"
      >
        로그아웃
      </button>
    </main>
  )
}
