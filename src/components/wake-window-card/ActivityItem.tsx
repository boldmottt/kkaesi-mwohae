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

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function CrossIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={filled ? 2.2 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  )
}

function buildLogPayload(args: {
  profileId: string
  date: string
  windowIndex: number
  activity: Activity
  did: boolean
  rating: Rating
  note: string | null
}) {
  return {
    profileId: args.profileId,
    logDate: args.date,
    windowIndex: args.windowIndex,
    activityName: args.activity.name,
    activityDuration: args.activity.duration,
    activityEffect: args.activity.effect,
    did: args.did,
    rating: args.rating,
    note: args.note,
  }
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
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isNoteLocallyDirty = useRef(false)
  const isSaving = useRef(false)
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!hasInitialized.current && log) {
      setDid(log.did ?? false)
      setRating((log.rating ?? 0) as Rating)
      setNote(log.note ?? '')
      hasInitialized.current = true
      return
    }

    if (hasInitialized.current && log) {
      setDid(log.did ?? false)
      setRating((log.rating ?? 0) as Rating)
      if (!isNoteLocallyDirty.current && !isSaving.current) {
        setNote(log.note ?? '')
      }
    }
  }, [log])

  const save = useCallback(async (next: { did: boolean; rating: Rating; note: string | null }) => {
    setSaving(true)
    isSaving.current = true
    try {
      const res = await fetch('/api/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildLogPayload({
            profileId,
            date,
            windowIndex,
            activity,
            did: next.did,
            rating: next.rating,
            note: next.note,
          })
        ),
      })
      const data = await res.json()
      if (res.ok && data.log) {
        onChange(data.log as ActivityLog)
      }
    } finally {
      setSaving(false)
      isSaving.current = false
    }
  }, [profileId, date, windowIndex, activity, onChange])

  function toggleDid() {
    const nextDid = !did
    setDid(nextDid)
    save({ did: nextDid, rating, note: note.trim() ? note : null })
  }

  function setRatingValue(next: Rating) {
    const value: Rating = rating === next ? 0 : next
    setRating(value)
    const nextDid = did || value !== 0
    if (!did && value !== 0) setDid(true)
    save({ did: nextDid, rating: value, note: note.trim() ? note : null })
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

  // 언마운트 시 미저장 메모 즉시 저장
  useEffect(() => {
    return () => {
      if (noteTimer.current) {
        clearTimeout(noteTimer.current)
        if (isNoteLocallyDirty.current) {
          const currentNote = note
          fetch('/api/activity-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(
              buildLogPayload({
                profileId,
                date,
                windowIndex,
                activity,
                did,
                rating,
                note: currentNote.trim() || null,
              })
            ),
          }).catch(() => {})
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-amber-500 font-bold text-sm">{index + 1}.</span>
              <span className={`font-semibold ${did ? 'line-through text-gray-400' : ''}`}>
                {activity.name}
              </span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {activity.duration}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{activity.effect}</p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setRatingValue(1)}
              aria-label="좋아요"
              className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                rating === 1
                  ? 'text-amber-500 bg-amber-50'
                  : 'text-gray-300 hover:text-amber-400'
              }`}
            >
              <HeartIcon filled={rating === 1} />
            </button>
            <button
              type="button"
              onClick={() => setRatingValue(-1)}
              aria-label="별로예요"
              className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                rating === -1
                  ? 'text-gray-600 bg-gray-100'
                  : 'text-gray-300 hover:text-gray-500'
              }`}
            >
              <CrossIcon filled={rating === -1} />
            </button>
          </div>
        </div>

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
