'use client'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { ActivityLog, ActivityCategory } from '@/lib/supabase/types'
import { MonthCalendar } from '@/components/memories/MonthCalendar'
import { DayDetailView } from '@/components/memories/DayDetailView'

type CategoryCounts = Partial<Record<ActivityCategory, number>>

function getToday() {
  const d = new Date()
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
  }
}

export default function MemoriesPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()

  const today = useMemo(() => getToday(), [])

  const [calYear, setCalYear] = useState(today.year)
  const [calMonth, setCalMonth] = useState(today.month)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dayCategoryData, setDayCategoryData] = useState<Record<string, CategoryCounts>>({})
  const [dayLogs, setDayLogs] = useState<ActivityLog[]>([])
  const [loadingCounts, setLoadingCounts] = useState(false)
  const [loadingDay, setLoadingDay] = useState(false)

  // 임시: 카테고리 재분류 상태
  const [migrating, setMigrating] = useState(false)
  const [migrateResult, setMigrateResult] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // 월간 카테고리 카운트 로드
  useEffect(() => {
    if (!profile) return
    let cancelled = false
    async function load() {
      setLoadingCounts(true)
      try {
        const monthStr = `${calYear}-${String(calMonth).padStart(2, '0')}`
        const res = await fetch(
          `/api/activity-logs?profileId=${profile!.id}&month=${monthStr}`
        )
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (!cancelled) setDayCategoryData(data.dayCategoryData ?? {})
      } catch {
        // 실패 시 빈 맵
      } finally {
        if (!cancelled) setLoadingCounts(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [profile, calYear, calMonth, reloadKey])

  // 선택 날짜 로그 로드
  useEffect(() => {
    if (!profile || !selectedDate) return
    let cancelled = false
    async function load() {
      setLoadingDay(true)
      try {
        const res = await fetch(
          `/api/activity-logs?profileId=${profile!.id}&date=${selectedDate}`
        )
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (!cancelled) {
          const meaningful = (data.logs as ActivityLog[]).filter(
            l => l.did || (l.note ?? '').trim().length > 0 || l.rating !== 0
          )
          setDayLogs(meaningful)
        }
      } catch {
        // 실패 시 빈 배열
      } finally {
        if (!cancelled) setLoadingDay(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [profile, selectedDate, reloadKey])

  const handleChangeMonth = useCallback((year: number, month: number) => {
    setCalYear(year)
    setCalMonth(month)
    setSelectedDate(null)
    setDayLogs([])
  }, [])

  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(prev => prev === date ? null : date)
  }, [])

  const handleCloseDay = useCallback(() => {
    setSelectedDate(null)
    setDayLogs([])
  }, [])

  // 임시: 카테고리 재분류 실행
  async function handleMigrate() {
    setMigrating(true)
    setMigrateResult(null)
    try {
      const res = await fetch('/api/migrate-categories', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setMigrateResult(`${data.updated}개 활동 분류 완료! (태그 ${data.tagsUpdated}개)`)
        // 달력 새로고침
        setReloadKey(prev => prev + 1)
      } else {
        setMigrateResult(`오류: ${data.error}`)
      }
    } catch {
      setMigrateResult('네트워크 오류가 발생했어요')
    } finally {
      setMigrating(false)
    }
  }

  if (profileLoading) {
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

  const monthTotal = Object.values(dayCategoryData).reduce(
    (sum, cats) => sum + Object.values(cats).reduce((s, c) => s + (c ?? 0), 0),
    0
  )
  const activeDays = Object.keys(dayCategoryData).length

  return (
    <main className="min-h-screen p-6 pb-24">
      <div className="mb-4">
        <h1 className="text-xl font-bold">추억</h1>
        <p className="text-sm text-gray-500">
          {profile.baby_name}와(과) 함께한 활동들
        </p>
      </div>

      {/* 임시: 카테고리 재분류 버튼 — 작업 완료 후 이 블록 삭제 */}
      <div className="mb-4">
        <button
          onClick={handleMigrate}
          disabled={migrating}
          className="w-full bg-amber-400 hover:bg-amber-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-wait"
        >
          {migrating ? '분류 중... (잠시 기다려주세요)' : '🔄 과거 활동 카테고리 분류하기'}
        </button>
        {migrateResult && (
          <p className={`mt-2 text-sm ${migrateResult.startsWith('오류') ? 'text-red-500' : 'text-green-600'} bg-white rounded-lg px-3 py-2`}>
            {migrateResult}
          </p>
        )}
      </div>

      {!loadingCounts && monthTotal > 0 && (
        <p className="text-xs text-gray-400 mb-3">
          {calMonth}월: {activeDays}일간 {monthTotal}개 활동 기록
        </p>
      )}

      <MonthCalendar
        year={calYear}
        month={calMonth}
        selectedDate={selectedDate}
        dayCategoryData={dayCategoryData}
        onSelectDate={handleSelectDate}
        onChangeMonth={handleChangeMonth}
      />

      {selectedDate && loadingDay && (
        <div className="mt-4 flex flex-col gap-3">
          {[1, 2].map(i => (
            <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {selectedDate && !loadingDay && (
        <DayDetailView
          date={selectedDate}
          logs={dayLogs}
          onClose={handleCloseDay}
        />
      )}

      {!selectedDate && !loadingCounts && monthTotal === 0 && (
        <div className="mt-6 bg-white rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-sm">
            {calMonth}월에는 아직 기록된 활동이 없어요.
            <br />
            오늘 활동에 체크해보세요!
          </p>
        </div>
      )}

      {!selectedDate && monthTotal > 0 && (
        <p className="mt-6 text-center text-xs text-gray-300">
          날짜를 눌러서 그날의 활동을 확인하세요
        </p>
      )}
    </main>
  )
}
