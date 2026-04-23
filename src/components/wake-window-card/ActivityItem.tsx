'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Activity, ActivityLog } from '@/lib/supabase/types'

interface Props {
  index: number
  activity: Activity
  profileId: string
  date: string
  windowIndex: number
  log?: ActivityLog
  onChange: (next: ActivityLog) => void
}

type Rating = -1 | 0 | 1

function SmileFace({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" fill={filled ? '#f59e0b' : 'none'} stroke={filled ? '#f59e0b' : '#d1d5db'} strokeWidth="1.5" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke={filled ? 'white' : '#d1d5db'} strokeWidth="1.5" fill="none" />
      <circle cx="9" cy="9.5" r="1" fill={filled ? 'white' : '#d1d5db'} />
      <circle cx="15" cy="9.5" r="1" fill={filled ? 'white' : '#d1d5db'} />
    </svg>
  )
}

function NeutralFace({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" fill={filled ? '#9ca3af' : 'none'} stroke={filled ? '#9ca3af' : '#d1d5db'} strokeWidth="1.5" />
      <line x1="8" y1="14" x2="16" y2="14" stroke={filled ? 'white' : '#d1d5db'} strokeWidth="1.5" />
      <circle cx="9" cy="9.5" r="1" fill={filled ? 'white' : '#d1d5db'} />
      <circle cx="15" cy="9.5" r="1" fill={filled ? 'white' : '#d1d5db'} />
    </svg>
  )
}

function SadFace({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" fill={filled ? '#6b7280' : 'none'} stroke={filled ? '#6b7280' : '#d1d5db'} strokeWidth="1.5" />
      <path d="M8 16s1.5-2 4-2 4 2 4 2" stroke={filled ? 'white' : '#d1d5db'} strokeWidth="1.5" fill="none" />
      <circle cx="9" cy="9.5" r="1" fill={filled ? 'white' : '#d1d5db'} />
      <circle cx="15" cy="9.5" r="1" fill={filled ? 'white' : '#d1d5db'} />
    </svg>
  )
}

function parseDurationMinutes(durationStr: string): number {
  const hourMin = durationStr.match(/(\d+)\s*시간\s*(\d+)\s*분/)
  if (hourMin) return parseInt(hourMin[1], 10) * 60 + parseInt(hourMin[2], 10)
  const hour = durationStr.match(/(\d+)\s*시간/)
  if (hour) return parseInt(hour[1], 10) * 60
  const min = durationStr.match(/(\d+)\s*분/)
  if (min) return parseInt(min[1], 10)
  return 0
}

function formatMinutes(mins: number): string {
  if (mins <= 0) return '0분'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}분`
  if (m === 0) return `${h}시간`
  return `${h}시간 ${m}분`
}

export function ActivityItem({
  index,
  activity,
  profileId,
  date,
  windowIndex,
  log,
  onChange,
}: Props) {
  const [did, setDid] = useState(log?.did ?? false)
  const [rating, setRating] = useState<Rating>((log?.rating ?? 0) as Rating)
  const [note, setNote] = useState(log?.note ?? '')
  const [saving, setSaving] = useState(false)
  const [durationEditing, setDurationEditing] = useState(false)
  // 실제 활동 시간 (로그에 저장된 값 우선, 없으면 추천 시간)
  const [actualDuration, setActualDuration] = useState<string>(
    log?.activity_duration ?? activity.duration
  )
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isNoteLocallyDirty = useRef(false)
  const isSaving = useRef(false)
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!hasInitialized.current && log) {
      setDid(log.did ?? false)
      setRating((log.rating ?? 0) as Rating)
      setNote(log.note ?? '')
      setActualDuration(log.activity_duration ?? activity.duration)
      hasInitialized.current = true
      return
    }

    if (hasInitialized.current && log) {
      setDid(log.did ?? false)
      setRating((log.rating ?? 0) as Rating)
      setActualDuration(log.activity_duration ?? activity.duration)
      if (!isNoteLocallyDirty.current && !isSaving.current) {
        setNote(log.note ?? '')
      }
    }
  }, [log, activity.duration])

  const save = useCallback(async (next: {
    did: boolean
    rating: Rating
    note: string | null
    duration?: string
  }) => {
    setSaving(true)
    isSaving.current = true
    try {
      const res = await fetch('/api/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          logDate: date,
          windowIndex,
          activityName: activity.name,
          activityDuration: next.duration ?? actualDuration,
          activityEffect: activity.effect,
          did: next.did,
          rating: next.rating,
          note: next.note,
          category: (activity as { category?: string }).category ?? 'other',
        }),
      })
      const data = await res.json()
      if (res.ok && data.log) {
        onChange(data.log as ActivityLog)
      }
    } finally {
      setSaving(false)
      isSaving.current = false
    }
  }, [profileId, date, windowIndex, activity, onChange, actualDuration])

  function toggleDid() {
    const nextDid = !did
    setDid(nextDid)
    setRating(0)
    if (!nextDid) setDurationEditing(false)
    save({ did: nextDid, rating: 0, note: note.trim() ? note : null })
  }

  function setRatingValue(next: Rating) {
    const value: Rating = rating === next ? 0 : next
    setRating(value)
    if (!did) setDid(true)
    save({ did: true, rating: value, note: note.trim() ? note : null })
  }

  function handleDurationAdd(addMinutes: number) {
    const current = parseDurationMinutes(actualDuration)
    const next = current + addMinutes
    const nextStr = formatMinutes(next)
    setActualDuration(nextStr)
    save({ did: true, rating, note: note.trim() ? note : null, duration: nextStr })
  }

  function handleDurationReset() {
    setActualDuration('0분')
    save({ did: true, rating, note: note.trim() ? note : null, duration: '0분' })
  }

  function onNoteChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    setNote(value)
    isNoteLocallyDirty.current = true
    if (noteTimer.current) clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(() => {
      const nextDid = did || value.trim().length > 0
      if (!did && value.trim().length > 0) setDid(true)
      save({ did: nextDid, rating, note: value.trim() || null }).then(() => {
        isNoteLocallyDirty.current = false
      })
    }, 600)
  }

  useEffect(() => {
    return () => {
      if (noteTimer.current) {
        clearTimeout(noteTimer.current)
        if (isNoteLocallyDirty.current) {
          const currentNote = note
          fetch('/api/activity-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              profileId,
              logDate: date,
              windowIndex,
              activityName: activity.name,
              activityDuration: actualDuration,
              activityEffect: activity.effect,
              did,
              rating,
              note: currentNote.trim() || null,
              category: (activity as { category?: string }).category ?? 'other',
            }),
          }).catch(() => {})
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const durationChanged = actualDuration !== activity.duration

  return (
    <li className="flex gap-3 items-start">
      <button
        type="button"
        onClick={toggleDid}
        aria-label={did ? '완료 취소' : '완료 체크'}
        className={`mt-0.5 w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition ${
          did
            ? 'bg-amber-500 border-amber-500 text-white'
            : 'border-gray-300 text-transparent'
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-amber-500 font-bold text-sm">{index + 1}.</span>
              <span className={`font-semibold ${did ? 'line-through text-gray-400' : ''}`}>
                {activity.name}
              </span>
              {/* 시간 배지 — 체크 후 탭하면 수정 모드 */}
              <button
                type="button"
                onClick={() => did && setDurationEditing(!durationEditing)}
                className={`text-xs px-2 py-0.5 rounded-full transition ${
                  durationChanged
                    ? 'bg-amber-100 text-amber-600 font-semibold'
                    : 'bg-gray-100 text-gray-400'
                } ${did ? 'hover:bg-amber-100 cursor-pointer' : 'cursor-default'}`}
              >
                {did ? actualDuration : activity.duration}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{activity.effect}</p>
          </div>
        </div>

        {/* 시간 수정 UI — 체크 + 수정 모드일 때만 */}
        {did && durationEditing && (
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDurationAdd(1)}
              className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              +1분
            </button>
            <button
              type="button"
              onClick={() => handleDurationAdd(5)}
              className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              +5분
            </button>
            <button
              type="button"
              onClick={() => handleDurationAdd(30)}
              className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              +30분
            </button>
            <button
              type="button"
              onClick={handleDurationReset}
              className="px-2.5 py-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              초기화
            </button>
            <button
              type="button"
              onClick={() => setDurationEditing(false)}
              className="px-2.5 py-1 text-xs text-amber-500 font-semibold"
            >
              완료
            </button>
          </div>
        )}

        {/* 3단계 표정 피드백 */}
        {did && (
          <div className="flex items-center gap-1 mt-2">
            <button
              type="button"
              onClick={() => setRatingValue(1)}
              aria-label="좋아함"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                rating === 1 ? 'bg-amber-50' : 'hover:bg-gray-50'
              }`}
            >
              <SmileFace filled={rating === 1} />
            </button>
            <button
              type="button"
              onClick={() => setRatingValue(0)}
              aria-label="보통"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                rating === 0 ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <NeutralFace filled={rating === 0} />
            </button>
            <button
              type="button"
              onClick={() => setRatingValue(-1)}
              aria-label="싫어함"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                rating === -1 ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <SadFace filled={rating === -1} />
            </button>
          </div>
        )}

        <textarea
          value={note}
          onChange={onNoteChange}
          placeholder="메모 — 어땠어요?"
          rows={1}
          className="mt-2 w-full text-sm bg-gray-50 border border-transparent rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-300 focus:bg-white resize-none placeholder:text-gray-300"
        />
        {saving && (
          <span className="sr-only" aria-live="polite">저장 중</span>
        )}
      </div>
    </li>
  )
}
