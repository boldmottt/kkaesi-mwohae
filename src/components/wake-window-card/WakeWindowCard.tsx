'use client'
import { useState, useEffect } from 'react'
import { Activity, WakeWindow } from '@/lib/supabase/types'
import { ActivityList } from './ActivityList'
import { ChatBox } from './ChatBox'
import { formatDuration, formatTimeRange } from '@/lib/utils/time'

interface Props {
  windowIndex: number
  totalWindows: number
  wakeWindow: WakeWindow
  profileId: string
  ageMonths: number
  ageDays: number
  date: string
}

export function WakeWindowCard({ windowIndex, totalWindows, wakeWindow, profileId, ageMonths, ageDays, date }: Props) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchActivities() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileId,
            windowIndex,
            totalWindows,
            durationMinutes: wakeWindow.duration_minutes,
            startTime: wakeWindow.start_time,
            ageMonths,
            ageDays,
            date,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed')
        setActivities(data.activities)
      } catch {
        setError('활동 추천을 불러오지 못했어요.')
      } finally {
        setLoading(false)
      }
    }
    fetchActivities()
  }, [profileId, windowIndex, totalWindows, wakeWindow.duration_minutes, wakeWindow.start_time, ageMonths, ageDays, date])

  const timeRange = wakeWindow.start_time
    ? formatTimeRange(wakeWindow.start_time, wakeWindow.duration_minutes)
    : null

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-amber-500 font-bold text-sm">깨시{windowIndex + 1}</span>
          <span className="ml-2 text-gray-700 font-semibold">
            {formatDuration(wakeWindow.duration_minutes)}
          </span>
        </div>
        {timeRange && (
          <span className="text-xs text-gray-400">{timeRange}</span>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-3">🎯 이렇게 놀아줘요</p>

      {error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : (
        <ActivityList activities={activities} loading={loading} />
      )}

      <ChatBox
        windowIndex={windowIndex}
        ageMonths={ageMonths}
        durationMinutes={wakeWindow.duration_minutes}
        currentActivities={activities}
        onActivitiesUpdate={setActivities}
      />
    </div>
  )
}
