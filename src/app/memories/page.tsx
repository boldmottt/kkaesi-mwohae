'use client'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { ActivityLog, ActivityCategory } from '@/lib/supabase/types'
import { MonthCalendar } from '@/components/memories/MonthCalendar'
import { DayDetailView } from '@/components/memories/DayDetailView'
import { InsightCard } from '@/components/memories/InsightCard'

type CategoryCounts = Record<ActivityCategory | string, number>

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

  // 인사이트 관련 상태
  const [insightMode, setInsightMode] = useState(false)
  const [insightDates, setInsightDates] = useState<Set<string>>(new Set())
  const [insightLogs, setInsightLogs] = useState<ActivityLog[]>([])
  const [loadingInsight, setLoadingInsight] = useState(false)
  const [isCustomRange, setIsCustomRange] = useState(false)

  // 월 전체 로그 (인사이트용)
  const [monthlyLogs, setMonthlyLogs] = useState<ActivityLog[]>([])
  const [loadingMonthlyLogs, setLoadingMonthlyLogs] = useState(false)

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
        // ignore
      } finally {
        if (!cancelled) setLoadingCounts(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [profile, calYear, calMonth])

  // 월 전체 로그 로드 (인사이트 카드용)
  useEffect(() => {
    if (!profile) return
    let cancelled = false
    async function load() {
      setLoadingMonthlyLogs(true)
      try {
        const startDate = `${calYear}-${String(calMonth).padStart(2, '0')}-01`
        const lastDay = new Date(calYear, calMonth, 0).getDate()
        const endDate = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

        // date 범위로 로그 가져오기 — 날짜별로 fetch
        const dates = Object.keys(dayCategoryData)
        if (dates.length === 0) {
          if (!cancelled) setMonthlyLogs([])
          return
        }

        const allLogs: ActivityLog[] = []
        for (const date of dates) {
          const res = await fetch(
            `/api/activity-logs?profileId=${profile!.id}&date=${date}`
          )
          if (cancelled) return
          if (res.ok) {
            const data = await res.json()
            allLogs.push(...(data.logs as ActivityLog[]))
          }
        }
        if (!cancelled) setMonthlyLogs(allLogs)
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingMonthlyLogs(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [profile, calYear, calMonth, dayCategoryData])

  // 선택 날짜 로그 로드 (일별 상세)
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
        // ignore
      } finally {
        if (!cancelled) setLoadingDay(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [profile, selectedDate])

  // 인사이트 날짜 선택 완료 시 로그 로드
  const loadInsightLogs = useCallback(async () => {
    if (!profile || insightDates.size === 0) return
    setLoadingInsight(true)
    try {
      const allLogs: ActivityLog[] = []
      for (const date of insightDates) {
        const res = await fetch(
          `/api/activity-logs?profileId=${profile.id}&date=${date}`
        )
        if (res.ok) {
          const data = await res.json()
          allLogs.push(...(data.logs as ActivityLog[]))
        }
      }
      setInsightLogs(allLogs)
      setIsCustomRange(true)
    } catch {
      // ignore
    } finally {
      setLoadingInsight(false)
    }
  }, [profile, insightDates])

  const handleChangeMonth = useCallback((year: number, month: number) => {
    setCalYear(year)
    setCalMonth(month)
    setSelectedDate(null)
    setDayLogs([])
    setInsightMode(false)
    setInsightDates(new Set())
    setIsCustomRange(false)
    setInsightLogs([])
  }, [])

  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(prev => prev === date ? null : date)
  }, [])

  const handleCloseDay = useCallback(() => {
    setSelectedDate(null)
    setDayLogs([])
  }, [])

  const handleToggleInsightDate = useCallback((date: string) => {
    setInsightDates(prev => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })
  }, [])

  const handleStartInsightMode = useCallback(() => {
    setInsightMode(true)
    setInsightDates(new Set())
    setSelectedDate(null)
    setDayLogs([])
  }, [])

  const handleFinishInsightMode = useCallback(() => {
    setInsightMode(false)
    if (insightDates.size > 0) {
      loadInsightLogs()
    }
  }, [insightDates, loadInsightLogs])

  const handleCancelInsightMode = useCallback(() => {
    setInsightMode(false)
    setInsightDates(new Set())
  }, [])

  const handleResetToMonthly = useCallback(() => {
    setIsCustomRange(false)
    setInsightLogs([])
    setInsightDates(new Set())
  }, [])

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

  // 인사이트에 보여줄 로그 결정
  const currentInsightLogs = isCustomRange ? insightLogs : monthlyLogs
  const currentInsightDayCount = isCustomRange ? insightDates.size : activeDays

  return (
    <main className="min-h-screen p-6 pb-24">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-amber-600">추억</h1>
        <p className="text-sm text-gray-500">
          {profile.baby_name}와(과) 함께한 활동들
        </p>
      </div>

      {!loadingCounts && monthTotal > 0 && (
        <p className="text-xs text-gray-400 mb-3">
          {calMonth}월: {activeDays}일간 {monthTotal}개 활동 기록
        </p>
      )}

      {/* 캘린더 */}
      <MonthCalendar
        year={calYear}
        month={calMonth}
        selectedDate={selectedDate}
        dayCategoryData={dayCategoryData}
        onSelectDate={handleSelectDate}
        onChangeMonth={handleChangeMonth}
        insightMode={insightMode}
        insightDates={insightDates}
        onToggleInsightDate={handleToggleInsightDate}
      />

      {/* 인사이트 모드 액션 바 */}
      {insightMode && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleCancelInsightMode}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            취소
          </button>
          <button
            onClick={handleFinishInsightMode}
            disabled={insightDates.size === 0}
            className="text-xs bg-violet-500 text-white px-3 py-1 rounded-full disabled:opacity-30"
          >
            {insightDates.size}일 인사이트 보기
          </button>
        </div>
      )}

      {/* 일별 상세 뷰 */}
      {!insightMode && selectedDate && loadingDay && (
        <div className="flex flex-col gap-3">
          {[1, 2].map(i => (
            <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {!insightMode && selectedDate && !loadingDay && (
        <DayDetailView date={selectedDate} logs={dayLogs} profileId={profile!.id} onClose={handleCloseDay} />
      )}

      {/* 인사이트 카드 (날짜 미선택 & 인사이트 모드 아닐 때) */}
      {!insightMode && !selectedDate && monthTotal > 0 && (
        <InsightCard
          logs={currentInsightLogs}
          dateCount={currentInsightDayCount}
          isCustomRange={isCustomRange}
          onStartSelectDates={handleStartInsightMode}
          onResetToMonthly={handleResetToMonthly}
        />
      )}

      {/* 빈 상태 */}
      {!insightMode && !selectedDate && !loadingCounts && monthTotal === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-sm">
            {calMonth}월에는 아직 기록된 활동이 없어요.
            <br />
            오늘 활동에 체크해보세요!
          </p>
        </div>
      )}
    </main>
  )
}
