'use client'
import { useState, useEffect, useCallback } from 'react'
import { ActivityLog, ActivityCategory } from '@/lib/supabase/types'
import { useProfileId } from '@/hooks/use-profile-id'
import { ActivityLogCard, ActivityLogForm } from './ActivityLogCard'
import { InsightCard } from '@/components/memories/InsightCard'

const CATS: ActivityCategory[] = ['physical', 'sensory', 'language', 'cognitive', 'emotional']

const CATEGORY_HEX: Record<ActivityCategory, string> = {
  physical: '#fb923c',
  sensory: '#a855f7',
  language: '#60a5fa',
  cognitive: '#4ade80',
  emotional: '#f472b6',
}

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  physical: '신체',
  sensory: '감각',
  language: '언어',
  cognitive: '인지',
  emotional: '정서',
}

export default function MemoriesPage() {
  const profileId = useProfileId()
  const [profile, setProfile] = useState<{ id: string; name: string } | null>(null)
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  // Insight mode state
  const [insightMode, setInsightMode] = useState(false)
  const [isCustomRange, setIsCustomRange] = useState(false)
  const [insightDates, setInsightDates] = useState<Set<string>>(new Set())
  const [selecting, setSelecting] = useState(false)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // Fetch profile
  useEffect(() => {
    if (!profileId) return
    async function loadProfile() {
      const res = await fetch(`/api/profiles/${profileId}`)
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
      }
    }
    loadProfile()
  }, [profileId])

  // Fetch logs for current month (or selected dates)
  const loadLogs = useCallback(async () => {
    if (!profileId || !month) return

    let url: string
    if (isCustomRange && insightDates.size > 0) {
      // Custom range: fetch each date separately and merge
      const allLogs: ActivityLog[] = []
      for (const date of insightDates) {
        const res = await fetch(`/api/activity-logs?profileId=${profileId}&date=${date}`)
        if (res.ok) {
          const data = await res.json()
          allLogs.push(...data)
        }
      }
      setLogs(allLogs.sort((a, b) => (b.log_date ?? '').localeCompare(a.log_date ?? '')))
      return
    }

    // Monthly view: fetch all logs for the month
    url = `/api/activity-logs?profileId=${profileId}&month=${month}`
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      setLogs(data.sort((a: ActivityLog, b: ActivityLog) => (b.log_date ?? '').localeCompare(a.log_date ?? '')))
    }
  }, [profileId, month, isCustomRange, insightDates])

  // Load logs on mount and when filters change
  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const handleSelectDate = (date: string) => {
    if (!selecting) return

    const newDates = new Set(insightDates)
    if (newDates.has(date)) {
      newDates.delete(date)
    } else {
      newDates.add(date)
    }

    setInsightDates(newDates)
    setIsCustomRange(newDates.size > 0)

    // Update logs for selected dates
    if (newDates.size === 0) {
      setIsCustomRange(false)
      loadLogs() // back to monthly view
    } else {
      loadLogs()
    }
  }

  const handleStartSelectDates = () => {
    setInsightMode(true)
    setSelecting(true)
  }

  const handleResetToMonthly = () => {
    setInsightMode(false)
    setIsCustomRange(false)
    setInsightDates(new Set())
  }

  const handleLoadInsightLogs = () => {
    loadLogs()
  }

  // Date helpers for calendar display
  const getDaysInMonth = (m: string) => {
    const [y, mo] = m.split('-').map(Number)
    return new Date(y, mo, 0).getDate()
  }

  const getFirstDayOfMonth = (m: string) => {
    const [y, mo] = m.split('-').map(Number)
    return new Date(y, mo - 1, 1).getDay()
  }

  const prevMonth = () => {
    const [y, mo] = month.split('-').map(Number)
    if (mo === 1) {
      setMonth(`${y - 1}-12`)
    } else {
      setMonth(`${y}-${String(mo - 1).padStart(2, '0')}`)
    }
  }

  const nextMonth = () => {
    const [y, mo] = month.split('-').map(Number)
    if (mo === 12) {
      setMonth(`${y + 1}-01`)
    } else {
      setMonth(`${y}-${String(mo + 1).padStart(2, '0')}`)
    }
  }

  const daysInMonth = getDaysInMonth(month)
  const firstDayOfWeek = getFirstDayOfMonth(month)

  // Get logs for a specific date (for calendar dots)
  const getLogsForDate = (day: number) => {
    const dateStr = `${month}-${String(day).padStart(2, '0')}`
    return logs.filter(l => l.log_date === dateStr)
  }

  const handleAddLog = (log: ActivityLog) => {
    setLogs(prev => [log, ...prev])
  }

  const handleUpdateLog = (updated: ActivityLog) => {
    setLogs(prev => prev.map(l => l.id === updated.id ? updated : l))
  }

  const handleDeleteLog = (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  const dateCount = isCustomRange ? insightDates.size : daysInMonth

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📖</span>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              {profile ? profile.name : '로딩 중...'}의 기록장
            </h1>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
          >
            + 기록하기
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="text-gray-400 hover:text-gray-600">
            ◀
          </button>

          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            {month.replace('-', '년 ')월}
          </h2>

          <button onClick={nextMonth} className="text-gray-400 hover:text-gray-600">
            ▶
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm mb-6">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${month}-${String(day).padStart(2, '0')}`
              const dayLogs = getLogsForDate(day)
              const hasLog = dayLogs.length > 0

              return (
                <button
                  key={day}
                  onClick={() => handleSelectDate(dateStr)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all ${
                    hasLog
                      ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                  } ${selecting ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}`}
                >
                  <span className="font-semibold">{day}</span>

                  {/* Activity dots */}
                  {hasLog && (
                    <div className="flex gap-0.5 mt-1">
                      {dayLogs.slice(0, 3).map((log, idx) => (
                        <span
                          key={idx}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: CATEGORY_HEX[(log.category as ActivityCategory) ?? 'other'] }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Selected indicator */}
                  {selecting && insightDates.has(dateStr) && (
                    <span className="absolute w-full h-full border-2 border-violet-500 rounded-lg" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            {CATS.map(cat => (
              <div key={cat} className="flex items-center gap-1.5 text-xs">
                <span style={{ backgroundColor: CATEGORY_HEX[cat] }} className="w-2 h-2 rounded-full" />
                <span className="text-gray-500">{CATEGORY_LABELS[cat]}</span>
              </div>
            ))}
          </div>

          {/* Insight mode indicator */}
          {selecting && (
            <div className="mt-3 text-center">
              <span className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-600 px-3 py-1 rounded-full">
                날짜를 선택하면 해당 기간의 인사이트가 표시됩니다 ({insightDates.size}일 선택됨)
              </span>
            </div>
          )}
        </div>

        {/* Insight Card */}
        <InsightCard
          logs={logs}
          dateCount={dateCount}
          isCustomRange={isCustomRange}
          profileId={profileId!}
          month={month}
          onStartSelectDates={handleStartSelectDates}
          onResetToMonthly={handleResetToMonthly}
        />

        {/* Activity Log List */}
        <div className="space-y-4">
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl">📝</span>
              <p className="mt-3 text-gray-400">아직 활동이 없어요</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 text-violet-500 hover:text-violet-600"
              >
                첫 활동을 기록해보세요!
              </button>
            </div>
          ) : (
            logs.map(log => (
              <ActivityLogCard
                key={log.id}
                log={log}
                onUpdate={handleUpdateLog}
                onDelete={() => setShowDeleteConfirm(log.id)}
              />
            ))
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mx-4 max-w-sm w-full">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                활동을 삭제하시겠습니까?
              </h3>
              <p className="text-sm text-gray-500 mb-4">이 작업은 되돌릴 수 없습니다.</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    handleDeleteLog(showDeleteConfirm)
                    setShowDeleteConfirm(null)
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  삭제하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Activity Form Modal */}
        {showForm && (
          <ActivityLogForm
            profileId={profileId!}
            onClose={() => { setShowForm(false); setEditingLog(null) }}
            onAdd={handleAddLog}
            onUpdate={handleUpdateLog}
            editingLog={editingLog}
          />
        )}
      </main>
    </div>
  )
}
