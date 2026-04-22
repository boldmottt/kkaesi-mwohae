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
    const nextRating: Rating = 0
    setRating(nextRating)
    save({ did: nextDid, rating: nextRating, note: note.trim() ? note : null })
  }

  function setRatingValue(next: Rating) {
    const value: Rating = rating === next ? 0 : next
    setRating(value)
    if (!did) setDid(true)
    save({ did: true, rating: value, note: note.trim() ? note : null })
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
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
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
        </div>

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
