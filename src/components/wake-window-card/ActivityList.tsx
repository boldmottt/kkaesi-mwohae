'use client'
import { useEffect, useState } from 'react'
import { Activity, ActivityLog } from '@/lib/supabase/types'
import { ActivityItem } from './ActivityItem'

interface Props {
  activities: Activity[]
  loading: boolean
  profileId: string
  date: string
  windowIndex: number
  refreshKey?: number
}

export function ActivityList({ activities, loading, profileId, date, windowIndex, refreshKey }: Props) {
  const [logs, setLogs] = useState<Record<string, ActivityLog>>({})
  const [customLogs, setCustomLogs] = useState<ActivityLog[]>([])

  useEffect(() => {
    if (!profileId || !date) return
    let cancelled = false
    async function fetchLogs() {
      try {
        const res = await fetch(
          `/api/activity-logs?profileId=${profileId}&date=${date}`
        )
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        const map: Record<string, ActivityLog> = {}
        const customs: ActivityLog[] = []
        for (const log of data.logs as ActivityLog[]) {
          if (log.window_index === windowIndex) {
            if (log.is_custom) {
              customs.push(log)
            } else {
              map[log.activity_name] = log
            }
          }
        }
        setLogs(map)
        setCustomLogs(customs)
      } catch {
        // swallow — logs are non-critical for viewing activities
      }
    }
    fetchLogs()
    return () => {
      cancelled = true
    }
  }, [profileId, date, windowIndex, refreshKey])

  if (loading) {
    return (
      <div data-testid="activity-skeleton" className="flex flex-col gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-amber-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  function updateLog(next: ActivityLog) {
    if (next.is_custom) {
      setCustomLogs(prev => prev.map(l => l.id === next.id ? next : l))
    } else {
      setLogs(prev => ({ ...prev, [next.activity_name]: next }))
    }
  }

  const totalRecommended = activities.length

  return (
    <div>
      <ol className="flex flex-col gap-3">
        {activities.map((activity, index) => (
          <ActivityItem
            key={`${activity.name}-${index}`}
            index={index}
            activity={activity}
            profileId={profileId}
            date={date}
            windowIndex={windowIndex}
            log={logs[activity.name]}
            onChange={updateLog}
          />
        ))}
      </ol>

      {customLogs.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2">✋ 직접 추가한 활동</p>
          <ol className="flex flex-col gap-3">
            {customLogs.map((log, index) => (
              <ActivityItem
                key={`custom-${log.id}`}
                index={totalRecommended + index}
                activity={{
                  name: log.activity_name,
                  duration: log.activity_duration ?? '',
                  effect: log.activity_effect ?? '직접 추가한 활동',
                }}
                profileId={profileId}
                date={date}
                windowIndex={windowIndex}
                log={log}
                onChange={updateLog}
              />
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
