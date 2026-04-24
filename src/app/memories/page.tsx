'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { ActivityLog, ActivityCategory } from '@/lib/supabase/types'
import { useProfile } from '@/hooks/useProfile'
import { MonthCalendar } from '@/components/memories/MonthCalendar'
import { DayDetailView } from '@/components/memories/DayDetailView'
import { InsightCard } from '@/components/memories/InsightCard'

type CategoryCounts = Record<ActivityCategory | string, number>

const gamjaStyle = { fontFamily: 'var(--font-gamja), cursive' }

export default function MemoriesPage() {
  const { profile } = useProfile()

  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const [dayCategoryData, setDayCategoryData] = useState<Record<string, Record<string, number>>>({})
  const [dayLogs, setDayLogs] = useState<ActivityLog[]>([])
  const [monthlyLogs, setMonthlyLogs] = useState<ActivityLog[]>([])

  const [loadingCounts, setLoadingCounts] = useState(false)
  const [loadingDay, setLoadingDay] = useState(false)
  const [loadingInsight, setLoadingInsight] = useState(false)

  // 인사이트 모드
  const [insightMode, setInsightMode] = useState(false)
  const [insightDates, setInsightDates] = useState<Set<string>>(new Set())
  const [insightLogs, setInsightLogs] = useState<ActivityLog[]>([])

  const monthStr = `${year}-${String(month).padStart(2, '0')}`

  // 월간 카테고리 데이터 로드
  useEffect(() => {
    if (!profile?.id) return
    let cancelled = false
    async function load() {
      setLoadingCounts(true)
      try {
        const res = await fetch(
          `/api/activity-logs?profileId=${profile!.id}&month=${monthStr}`
        )
        if (!res.ok || cancelled) return
        const data = await res.json()
        const logs: ActivityLog[] = data.logs ?? []

        // dayCategoryData 구축
        const catData: Record<string, Record<string, number>> = {}
        for (const log of logs) {
          const hasMeaning = log.did || (log.note ?? '').trim().length > 0 || log.rating !== 0
          if (!hasMeaning) continue
          if (!catData[log.log_date]) catData[log.log_date] = {}
          const cat = (log.category as string) ?? 'other'
          catData[log.log_date][cat] = (catData[log.log_date][cat] ?? 0) + 1
        }
        if (!cancelled) {
          setDayCategoryData(catData)
          setMonthlyLogs(logs)
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingCounts(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [profile?.id, monthStr])

  // 선택된 날짜의 로그 로드
  useEffect(() => {
    if (!profile?.id || !selectedDate) {
      setDayLogs([])
      return
    }
    let cancelled = false
    async function load() {
      setLoadingDay(true)
      try {
        const res = await fetch(
          `/api/activity-logs?profileId=${profile!.id}&date=${selectedDate}`
        )
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (!cancelled) setDayLogs(data.logs ?? [])
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingDay(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [profile?.id, selectedDate])

  // 인사이트 날짜들의 로그 로드
  useEffect(() => {
    if (!profile?.id || insightDates.size === 0) {
      setInsightLogs([])
      return
    }
    let cancelled = false
    async function load() {
      setLoadingInsight(true)
      try {
        const allLogs: ActivityLog[] = []
        for (const date of insightDates) {
          const res = await fetch(
            `/api/activity-logs?profileId=${profile!.id}&date=${date}`
          )
          if (res.ok && !cancelled) {
            const data = await res.json()
            allLogs.push(...(data.logs ?? []))
          }
        }
        if (!cancelled) setInsightLogs(allLogs)
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingInsight(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [profile?.id, insightDates])

  const handleChangeMonth = useCallback((y: number, m: number) => {
    setYear(y)
    setMonth(m)
    setSelectedDate(null)
    setInsightMode(false)
    setInsightDates(new Set())
  }, [])

  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date)
    setInsightMode(false)
    setInsightDates(new Set())
  }, [])

  const handleToggleInsightDate = useCallback((date: string) => {
    setInsightDates((prev: Set<string>) => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })
  }, [])

  const handleStartSelectDates = useCallback(() => {
    setSelectedDate(null)
    setInsightMode(true)
    setInsightDates(new Set())
  }, [])

  const handleResetToMonthly = useCallback(() => {
    setInsightMode(false)
    setInsightDates(new Set())
    setInsightLogs([])
  }, [])

  // 인사이트 카드에 표시할 로그와 dateCount 결정
  const isCustomRange = insightMode && insightDates.size > 0
  const insightDisplayLogs = isCustomRange ? insightLogs : monthlyLogs
  const insightDateCount = isCustomRange
    ? insightDates.size
    : Object.keys(dayCategoryData).length

  // 월간 총 활동이 있는지
  const monthTotal = useMemo(() => {
    let total = 0
    for (const counts of Object.values(dayCategoryData)) {
      for (const n of Object.values(counts as Record<string, number>)) total += (n as number) ?? 0
    }
    return total
  }, [dayCategoryData])

  if (!profile) {
    return (
      <main className="min-h-screen p-6">
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </main>
    )
  }

  // 날짜 선택 시 → DayDetailView
  if (selectedDate && !insightMode) {
    return (
      <DayDetailView
        date={selectedDate}
        logs={dayLogs}
        profileId={profile.id}
        onClose={() => setSelectedDate(null)}
      />
    )
  }

  return (
    <main className="min-h-screen p-6 pb-24">
      {/* 제목 */}
      <h1 className="text-xl font-bold text-amber-600 mb-4" style={gamjaStyle}>
        {profile.baby_name}의 추억
      </h1>

      {/* 캘린더 */}
      <div className="mb-4">
        {loadingCounts ? (
          <p className="text-sm text-gray-400">캘린더 불러오는 중...</p>
        ) : (
          <MonthCalendar
            year={year}
            month={month}
            selectedDate={selectedDate}
            dayCategoryData={dayCategoryData}
            onSelectDate={handleSelectDate}
            onChangeMonth={handleChangeMonth}
            insightMode={insightMode}
            insightDates={insightDates}
            onToggleInsightDate={handleToggleInsightDate}
          />
        )}
      </div>

      {/* 인사이트 모드 완료 버튼 */}
      {insightMode && insightDates.size > 0 && (
        <div className="flex justify-center mb-4">
          <button
            onClick={() => setInsightMode(false)}
            className="bg-violet-500 text-white text-sm px-6 py-2 rounded-full"
          >
            {insightDates.size}일 선택 완료 · 인사이트 보기
          </button>
        </div>
      )}

      {/* 인사이트 카드 — 날짜 미선택 + 데이터 있을 때 */}
      {!selectedDate && (monthTotal > 0 || isCustomRange) && (
        <InsightCard
          logs={insightDisplayLogs}
          dateCount={insightDateCount}
          isCustomRange={isCustomRange}
          onStartSelectDates={handleStartSelectDates}
          onResetToMonthly={handleResetToMonthly}
        />
      )}

      {/* 데이터 없을 때 */}
      {!selectedDate && monthTotal === 0 && !loadingCounts && (
        <div className="text-center py-10">
          <p className="text-3xl">📝</p>
          <p className="text-sm text-gray-500 mt-2">이번 달은 아직 기록이 없어요</p>
          <p className="text-xs text-gray-400 mt-1">활동을 기록하면 여기서 추억을 돌아볼 수 있어요</p>
        </div>
      )}
    </main>
  )
}
