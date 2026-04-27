'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { WakeWindowSettings, WakeWindowDraft } from '@/components/settings/WakeWindowSettings'

export default function OnboardingPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [babyName, setBabyName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [windows, setWindows] = useState<WakeWindowDraft[]>([
    { duration_minutes: 30, start_time: '', routines: '' },
    { duration_minutes: 90, start_time: '', routines: '' },
    { duration_minutes: 180, start_time: '', routines: '' },
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login')
      } else {
        setAuthChecked(true)
      }
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({ owner_user_id: user.id, baby_name: babyName, birth_date: birthDate })
      .select()
      .single()

    if (profileError || !profile) {
      setError('프로필 저장에 실패했어요. 다시 시도해 주세요.')
      setSaving(false)
      return
    }

    const { error: windowError } = await supabase.from('wake_windows').insert(
      windows.map((w, i) => ({
        profile_id: profile.id,
        window_index: i,
        duration_minutes: w.duration_minutes,
        start_time: w.start_time || null,
        routines: w.routines || null,
      }))
    )

    if (windowError) {
      setError('깨시 설정 저장에 실패했어요. 다시 시도해 주세요.')
      setSaving(false)
      return
    }

    router.push('/')
  }

  if (!authChecked) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-gray-400 text-sm">확인 중...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-6 pb-10">
      <h1 className="text-2xl font-bold mb-1">깨시뭐해</h1>
      <p className="text-gray-500 text-sm mb-8">아기 정보를 입력해 주세요</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="text-sm text-gray-500 mb-1 block">아기 이름</label>
          <input
            value={babyName}
            onChange={e => setBabyName(e.target.value)}
            required
            className="border border-gray-300 rounded-xl px-4 py-3 w-full"
            placeholder="아기 이름"
          />
        </div>

        <div>
          <label className="text-sm text-gray-500 mb-1 block">생년월일</label>
          <input
            type="date"
            value={birthDate}
            onChange={e => setBirthDate(e.target.value)}
            required
            className="border border-gray-300 rounded-xl px-4 py-3 w-full"
          />
        </div>

        <WakeWindowSettings value={windows} onChange={setWindows} />

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-brand-400 text-white rounded-xl py-3 font-semibold mt-2 disabled:opacity-60"
        >
          {saving ? '저장 중...' : '시작하기'}
        </button>
      </form>
    </main>
  )
}
