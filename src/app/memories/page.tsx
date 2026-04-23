'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { ActivityLog } from '@/lib/supabase/types'

function formatDate(d: string): string {
  const [y, m, day] = d.split('-')
  return `${y}년 ${Number(m)}월 ${Number(day)}일`
}

function RatingBadge({ rating }: { rating: number }) {
  if (rating === 0) return null
  if (rating === 1) {
    return (
      <span className="text-amber-500 shrink-0" aria-label="좋았어요">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </span>
    )
  }
  return (
    <span className="text-gray-400 shrink-0" aria-label="별로였어요">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="6" x2="18" y2="18" />
        <line x1="18" y1="6" x2="6" y2="18" />
      </svg>
    </span>
  )
}

interface LogCardProps {
  log: ActivityLog
  profileId: string
  onUpdate: (next: ActivityLog) => void
  onDelete: (id: string) => void
}

function LogCard({ log, profileId, onUpdate, onDelete }: LogCardProps) {
  const [note, setNote] = useState(log.note ?? '')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setNote(log.note ?? '')
  }, [log.note])

  function onNoteChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    setNote(value)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const res = await fetch('/api/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          logDate: log.log_date,
          windowIndex: log.window_index,
          activityName: log.activity_name,
          activityDuration: log.activity_duration,
          activityEffect: log.activity_effect,
          did: log.did,
          rating: log.rating,
          note: value.trim() || null,
        }),
      })
      const data = await res.json()
      if (res.ok && data.log) onUpdate(data.log as ActivityLog)
    }, 600)
  }

  async function handleDelete() {
    if (!confirm('이 기록을 삭제할까요?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/activity-logs?id=${log.id}`, { method: 'DELETE' })
      if (res.ok) onDelete(log.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <article className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{log.activity_name}</span>
            {log.activity_duration && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {log.activity_duration}
              </span>
            )}
            <span className="text-xs text-gray-400">
              깨시{log.window_index + 1}
            </span>
          </div>
          {log.activity_effect && (
            <p className="text-xs text-gray-400 mt-0.5">{log.activity_effect}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <RatingBadge rating={log.rating} />
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="기록 삭제"
            className="text-gray-300 hover:text-red-400 disabled:opacity-40 p-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
      <textarea
        value={note}
        onChange={onNoteChange}
        placeholder="메모 — 어땠어요?"
        rows={note ? 2 : 1}
        className="mt-2 w-full text-sm bg-amber-50/50 border border-transparent rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-300 focus:bg-white resize-none placeholder:text-gray-300 whitespace-pre-wrap"
      />
    </article>
  )
}

export default function MemoriesPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    let cancelled = false
    async function fetchLogs() {
      setLoading(true)
      try {
        const res = await fetch(`/api/activity-logs?profileId=${profile!.id}&limit=300`)
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        const done = (data.logs as ActivityLog[]).filter(
          l => l.did || (l.note ?? '').trim().length > 0 || l.rating !== 0
        )
        setLogs(done)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchLogs()
    return () => {
      cancelled = true
    }
  }, [profile])

  const grouped = useMemo(() => {
    const map = new Map<string, ActivityLog[]>()
    for (const log of logs) {
      const list = map.get(log.log_date) ?? []
      list.push(log)
      map.set(log.log_date, list)
    }
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? 1 : -1))
  }, [logs])

  function handleUpdate(next: ActivityLog) {
    setLogs(prev => prev.map(l => (l.id === next.id ? next : l)))
  }

  function handleDelete(id: string) {
    setLogs(prev => prev.filter(l => l.id !== id))
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

  return (
    <main className="min-h-screen p-6 pb-24">
      <div className="mb-6">
        <h1 className="text-xl font-bold">추억</h1>
        <p className="text-sm text-gray-500">
          {profile.baby_name}와(과) 함께한 활동들
        </p>
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && grouped.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-sm">
            아직 기록된 활동이 없어요.
            <br />
            오늘 활동에 체크해보세요!
          </p>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {grouped.map(([date, dayLogs]) => (
          <section key={date}>
            <h2 className="text-sm font-semibold text-amber-500 mb-2">
              {formatDate(date)}
            </h2>
            <div className="flex flex-col gap-2">
              {dayLogs.map(log => (
                <LogCard
                  key={log.id}
                  log={log}
                  profileId={profile.id}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
