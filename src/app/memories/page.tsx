'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { ActivityLog, ActivityCategory } from '@/lib/supabase/types'
import { useProfile } from '@/hooks/useProfile'
import { MonthCalendar } from '@/components/memories/MonthCalendar'
import { DayDetailView } from '@/components/memories/DayDetailView'
import { InsightCard } from '@/components/memories/InsightCard'

type CategoryCounts = Record<ActivityCategory, number>

const gamjaStyle = { fontFamily: 'var(--font-gamja), cursive' }

export default function MemoriesPage() {
  const { profile } = useProfile()

  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const [dayCategoryData, setDayCategoryData] = useState<Record<string, CategoryCounts>>({})
  const [dayLogs, setDayLogs] = useState<ActivityLog[]>([])
  const [monthlyLogs, setMonthlyLogs] = useState<ActivityLog[]>([])

  const [loadingCounts, setLoadingCounts] = useState(false)
  const [loadingDay, setLoadingDay] = useState(false)
  const [loadingInsight, setLoadingInsight] = useState(false)

  const [insightMode, setInsightMode] = useState(false)
  const [insightDates, setInsightDates] = useState<Set<string>>(new Set())
  const [insightLogs, setInsightLogs] = useState<ActivityLog[]>([])

  const monthStr = `${year}-${String(month).padStart(2, '0')}`

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
        const raw = await res.json()
        const logs: ActivityLog[] = Array.isArray(raw) ? raw : (raw.logs ?? [])

        const data: Record<string, CategoryCounts> = {}
        for (const log of logs) {
          if (!data[log.log_date]) data[log.log_date] = {}
          const cat = (log.category as string) ?? 'other'
          data[log.log_date][cat] = (data[log.log_date][cat] ?? 0) + 1
        }
        if (!cancelled) {
          setDayCategoryData(data)
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
        const raw = await res.json()
        if (!cancelled) setDayLogs(Array.isArray(raw) ? raw : (raw.logs ?? []))
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingDay(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [profile?.id, selectedDate])

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
            const raw = await res.json()
            const logs: ActivityLog[] = Array.isArray(raw) ? raw : (raw.logs ?? [])
            allLogs.push(...logs)
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
    setInsightDates(prev => {
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

  const isCustomRange = insightMode && insightDates.size > 0
  const insightDisplayLogs = isCustomRange ? insightLogs : monthlyLogs
  const insightDateCount = isCustomRange
    ? insightDates.size
    : Object.keys(dayCategoryData).length

  const monthTotal = useMemo(() => {
    return Object.values(dayCategoryData).reduce((sum, counts) => {
      return sum + Object.values(counts).reduce((s, c) => s + (c ?? 0), 0)
    }, 0)
  }, [dayCategoryData])

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">불러오는 중...</p>
      </div>
    )
  }

  if (selectedDate && !insightMode) {
    return (
      <DayDetailView
        profileId={profile.id}
        date={selectedDate}
        onBack={() => setSelectedDate(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white" style={gamjaStyle}>
            {profile.baby_name}의 추억
          </h1>

          <div className="flex gap-2">
            {isCustomRange && (
              <button
                onClick={() => setInsightMode(false)}
                className="bg-violet-500 text-white text-sm px-6 py-2 rounded-full"
              >
                {insightDates.size}일 선택 완료 · 인사이트 보기
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Calendar */}
        <div className="mb-6">
          {loadingCounts ? (
            <p className="text-center text-gray-400">캘린더 불러오는 중...</p>
          ) : (
            <MonthCalendar
              profileId={profile.id}
              year={year}
              month={month}
              dayCategoryData={dayCategoryData}
              onSelectMonth={handleChangeMonth}
              onSelectDate={handleSelectDate}
              selecting={insightMode}
              selectedDates={insightDates}
              onToggleDate={handleToggleInsightDate}
            />
          )}
        </div>

        {/* Insight mode indicator */}
        {insightMode && insightDates.size > 0 && (
          <div className="mb-4 text-center">
            <button
              onClick={() => setInsightMode(false)}
              className="bg-violet-500 text-white text-sm px-6 py-2 rounded-full"
            >
              {insightDates.size}일 선택 완료 · 인사이트 보기
            </button>
          </div>
        )}

        {/* Insight Card */}
        {!selectedDate && (monthTotal > 0 || isCustomRange) && (
          <InsightCard
            logs={insightDisplayLogs}
            dateCount={insightDateCount}
            isCustomRange={isCustomRange}
            profileId={profile.id}
            month={`${year}-${String(month).padStart(2, '0')}`}
            onStartSelectDates={handleStartSelectDates}
            onResetToMonthly={handleResetToMonthly}
          />
        )}

        {/* Empty state */}
        {!selectedDate && monthTotal === 0 && !loadingCounts && (
          <div className="text-center py-12">
            <span className="text-4xl">📝</span>
            <p className="mt-3 text-gray-400">이번 달은 아직 기록이 없어요</p>
            <p className="text-sm text-gray-300 mt-1">활동을 기록하면 여기서 추억을 돌아볼 수 있어요</p>
          </div>
        )}
      </main>
    </div>
  )
}
