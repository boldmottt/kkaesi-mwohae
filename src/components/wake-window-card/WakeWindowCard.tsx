'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
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
  const [error, setError] = useState<string | null>(null)
  const [logsRefreshKey, setLogsRefreshKey] = useState(0)
  const hasFetched = useRef(false)

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

  async function handleRefresh() {
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
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-amber-500 font-bold text-sm">깨시{windowIndex + 1}</span>
          <span className="ml-2 text-gray-700 font-semibold">
            {formatDuration(actualDurationMinutes ?? wakeWindow.duration_minutes)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {timeRange && (
            <span className="text-xs text-gray-400">{timeRange}</span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="text-xs text-gray-400 hover:text-amber-500 disabled:opacity-40 transition-colors"
            title="다시 추천받기"
          >
            {refreshing ? '추천 중...' : '↻ 다시 추천'}
          </button>
        </div>
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
      />
    </div>
  )
}
