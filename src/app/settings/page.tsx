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

  // 마이그레이션 상태
  const [migrating, setMigrating] = useState(false)
  const [migrateResult, setMigrateResult] = useState<string | null>(null)

  // 캐시 초기화 상태
  const [clearingCache, setClearingCache] = useState(false)
  const [cacheResult, setCacheResult] = useState<string | null>(null)

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

  async function handleMigrate() {
    setMigrating(true)
    setMigrateResult(null)
    try {
      const res = await fetch('/api/migrate-categories', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setMigrateResult(`${data.updated}개 활동 분류 완료! (태그 ${data.tagsUpdated ?? 0}개)`)
      } else {
        setMigrateResult(`오류: ${data.error}`)
      }
    } catch {
      setMigrateResult('네트워크 오류가 발생했어요')
    } finally {
      setMigrating(false)
    }
  }

  async function handleClearCache() {
    if (!profile) return
    setClearingCache(true)
    setCacheResult(null)
    try {
      const res = await fetch(`/api/activity-cache?profileId=${profile.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok) {
        setCacheResult('캐시가 초기화됐어요!')
      } else {
        setCacheResult(`오류: ${data.error}`)
      }
    } catch {
      setCacheResult('네트워크 오류가 발생했어요')
    } finally {
      setClearingCache(false)
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (windows.length === 0 && wakeWindows.length === 0) {
    return (
      <div className="min-h-screen bg-amber-50 p-6">
        <p>불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50 p-6">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-900">설정</h1>
          <button onClick={() => router.push('/')} className="text-gray-400 text-sm">
            닫기
          </button>
        </div>

        {profile && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-gray-600">아기: {profile.baby_name}</p>
          </div>
        )}

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-amber-800 mb-3">깨시 설정</h2>

          <WakeWindowSettings value={windows} onChange={setWindows} />

          <button
            onClick={handleSaveWindows}
            disabled={saving || windows.length === 0}
            className="w-full bg-amber-500 text-white py-2 rounded-lg mt-4"
          >
            {saving ? '저장 중...' : saveSuccess ? '저장됨 ✓' : '저장'}
          </button>
        </div>

        <BabyTimeImport />

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-amber-800 mb-3">배우자 공유</h2>
          <p className="text-sm text-gray-600 mb-3">
            초대 링크를 공유하면 배우자도 같은 깨시 스케줄을 볼 수 있어요.
          </p>

          <button
            onClick={handleCreateInvite}
            className="w-full bg-amber-500 text-white py-2 rounded-lg"
          >
            초대 링크 생성 + 복사
          </button>

          {inviteUrl && (
            <p className="text-green-600 text-sm mt-2">링크가 클립보드에 복사됐어요!</p>
          )}
        </div>

        {/* 관리 도구 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-amber-800 mb-3">관리 도구</h2>

          {/* 카테고리 재분류 */}
          <div className="mb-4">
            <button
              onClick={handleMigrate}
              disabled={migrating}
              className="w-full bg-purple-500 text-white py-2 rounded-lg"
            >
              {migrating ? '분류 중... (잠시 기다려주세요)' : '활동 카테고리 재분류'}
            </button>
            {migrateResult && (
              <p className={`text-sm mt-2 ${migrateResult.startsWith('오류') ? 'text-red-500' : 'text-green-600'}`}>
                {migrateResult}
              </p>
            )}
          </div>

          {/* 캐시 초기화 */}
          <div>
            <button
              onClick={handleClearCache}
              disabled={clearingCache || !profile}
              className="w-full bg-blue-500 text-white py-2 rounded-lg"
            >
              {clearingCache ? '초기화 중...' : '활동 추천 캐시 초기화'}
            </button>
            {cacheResult && (
              <p className={`text-sm mt-2 ${cacheResult.startsWith('오류') ? 'text-red-500' : 'text-green-600'}`}>
                {cacheResult}
              </p>
            )}
          </div>
        </div>

        <button onClick={handleLogout} className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg">
          로그아웃
        </button>
      </div>
    </div>
  )
}
