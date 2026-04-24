'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Activity, WakeWindow } from '@/lib/supabase/types'
import { ActivityList } from './ActivityList'
import { AddCustomActivity } from './AddCustomActivity'
import { ChatBox } from './ChatBox'
import { formatDuration, formatTimeRange, formatPeriodTime, parseTimeString } from '@/lib/utils/time'

interface Props {
  windowIndex: number
  totalWindows: number
  wakeWindow: WakeWindow
  profileId: string
  ageMonths: number
  ageDays: number
  date: string
  overrideActivities?: Activity[]
  onActivitiesLoaded?: (windowIndex: number, activities: Activity[]) => void
  actualEndTime?: string
}

export function WakeWindowCard({
  windowIndex,
  totalWindows,
  wakeWindow,
  profileId,
  ageMonths,
  ageDays,
  date,
  overrideActivities,
  onActivitiesLoaded,
  actualEndTime,
}: Props) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshConfirm, setRefreshConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logsRefreshKey, setLogsRefreshKey] = useState(0)
  const [collapsed, setCollapsed] = useState(() => {
    if (!wakeWindow.start_time) return false
    try {
      const now = new Date()
      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      const { hours, minutes } = parseTimeString(wakeWindow.start_time)
      const startMinutes = hours * 60 + minutes
      const endMinutes = startMinutes + wakeWindow.duration_minutes
      return !(nowMinutes >= startMinutes && nowMinutes < endMinutes)
    } catch { return false }
  })
  const hasFetched = useRef(false)
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current) }
  }, [])

  // requestBody는 최신 wakeWindow 값 사용 (refresh 시)
  function buildRequestBody() {
    return {
      profileId,
      windowIndex,
      totalWindows,
      durationMinutes: wakeWindow.duration_minutes,
      startTime: wakeWindow.start_time,
      routines: wakeWindow.routines,
      ageMonths,
      ageDays,
      date,
    }
  }

  // overrideActivities가 있으면 바로 사용
  useEffect(() => {
    if (overrideActivities && overrideActivities.length > 0) {
      setActivities(overrideActivities)
      setLoading(false)
      hasFetched.current = true
    }
  }, [overrideActivities])

  // 최초 1회만 fetch (start_time 변경으로 재fetch하지 않음)
  useEffect(() => {
    if (hasFetched.current) return
    if (overrideActivities && overrideActivities.length > 0) return

    async function fetchActivities() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildRequestBody()),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed')
        setActivities(data.activities)
        onActivitiesLoaded?.(windowIndex, data.activities)
        hasFetched.current = true
      } catch {
        setError('활동 추천을 불러오지 못했어요.')
      } finally {
        setLoading(false)
      }
    }
    fetchActivities()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, windowIndex, date])

  async function doRefresh() {
    setRefreshing(true)
    setError(null)
    try {
      const res = await fetch('/api/activities/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRequestBody()),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setActivities(data.activities)
      onActivitiesLoaded?.(windowIndex, data.activities)
    } catch {
      setError('다시 추천받기에 실패했어요.')
    } finally {
      setRefreshing(false)
    }
  }

  function handleRefreshClick() {
    if (refreshConfirm) {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current)
      setRefreshConfirm(false)
      doRefresh()
    } else {
      setRefreshConfirm(true)
      confirmTimerRef.current = setTimeout(() => setRefreshConfirm(false), 3000)
    }
  }

  const handleActivitiesUpdate = useCallback(async (newActivities: Activity[]) => {
    setActivities(newActivities)
    onActivitiesLoaded?.(windowIndex, newActivities)
    try {
      await fetch('/api/activities/cache', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, date, windowIndex, activities: newActivities }),
      })
    } catch {
      console.error('Failed to persist activity update to cache')
    }
  }, [profileId, date, windowIndex, onActivitiesLoaded])

  function handleCustomActivitySaved() {
    setLogsRefreshKey(prev => prev + 1)
  }

  const isCurrentWindow = useMemo(() => {
    if (!wakeWindow.start_time) return false
    try {
      const now = new Date()
      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      const { hours, minutes } = parseTimeString(wakeWindow.start_time)
      const startMinutes = hours * 60 + minutes
      const endMinutes = startMinutes + wakeWindow.duration_minutes
      return nowMinutes >= startMinutes && nowMinutes < endMinutes
    } catch { return false }
  }, [wakeWindow.start_time, wakeWindow.duration_minutes])

  const actualDurationMinutes = (() => {
    if (!actualEndTime || !wakeWindow.start_time) return null
    const { hours: sh, minutes: sm } = parseTimeString(wakeWindow.start_time)
    const { hours: eh, minutes: em } = parseTimeString(actualEndTime)
    let diff = (eh * 60 + em) - (sh * 60 + sm)
    if (diff < 0) diff += 24 * 60
    return diff > 0 ? diff : null
  })()

  const timeRange = (() => {
    if (!wakeWindow.start_time) return null
    if (actualEndTime) {
      const { hours: sh, minutes: sm } = parseTimeString(wakeWindow.start_time)
      const { hours: eh, minutes: em } = parseTimeString(actualEndTime)
      const startLabel = formatPeriodTime(sh * 60 + sm)
      const endLabel = formatPeriodTime(eh * 60 + em)
      return `${startLabel}~${endLabel}`
    }
    return formatTimeRange(wakeWindow.start_time, wakeWindow.duration_minutes)
  })()

  return (
    <div className={`bg-white rounded-2xl shadow-sm transition-shadow ${isCurrentWindow ? 'ring-2 ring-amber-400 shadow-md' : ''}`}>
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-amber-500 font-bold text-sm">깨시{windowIndex + 1}</span>
          {isCurrentWindow && <span className="text-[10px] bg-amber-400 text-white px-1.5 py-0.5 rounded-full">지금</span>}
          <span className="ml-1 text-gray-700 font-semibold">
            {formatDuration(actualDurationMinutes ?? wakeWindow.duration_minutes)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {timeRange && (
            <span className="text-xs text-gray-400">{timeRange}</span>
          )}
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`text-gray-300 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {!collapsed && (
        <div className="px-5 pb-5">
          <div className="flex justify-end mb-3">
            <button
              onClick={handleRefreshClick}
              disabled={refreshing || loading}
              className={`text-xs disabled:opacity-40 transition-colors ${
                refreshConfirm
                  ? 'text-orange-500 font-semibold'
                  : 'text-gray-400 hover:text-amber-500'
              }`}
              title={refreshConfirm ? '한 번 더 탭하면 추천이 교체돼요' : '다시 추천받기'}
            >
              {refreshing ? '추천 중...' : refreshConfirm ? '↻ 정말요?' : '↻ 다시 추천'}
            </button>
          </div>

          {wakeWindow.routines && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3">
              📌 {wakeWindow.routines}
            </p>
          )}

          <p className="text-sm text-gray-500 mb-3">🎯 이렇게 놀아줘요</p>

          {error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : (
            <ActivityList
              activities={activities}
              loading={loading}
              profileId={profileId}
              date={date}
              windowIndex={windowIndex}
              refreshKey={logsRefreshKey}
            />
          )}

          <AddCustomActivity
            profileId={profileId}
            date={date}
            windowIndex={windowIndex}
            onSaved={handleCustomActivitySaved}
          />

          <ChatBox
            windowIndex={windowIndex}
            ageMonths={ageMonths}
            durationMinutes={wakeWindow.duration_minutes}
            currentActivities={activities}
            onActivitiesUpdate={handleActivitiesUpdate}
            profileId={profileId}
            date={date}
          />
        </div>
      )}
    </div>
  )
}
