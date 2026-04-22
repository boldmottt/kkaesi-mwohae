'use client'
import { useState, useEffect } from 'react'
import { SleepLog } from '@/lib/supabase/types'

interface Props {
  profileId: string
  date: string
  napIndex: number
  totalWindows: number
  onSleepChanged: (napIndex: number, sleepEnd: string | null) => void
}

function getLabel(napIndex: number, totalWindows: number): string {
  if (napIndex === 0) return '간밤 수면'
  if (napIndex > totalWindows - 1) return '취침'
  return `${napIndex}번째 낮잠`
}

function getEmoji(napIndex: number, totalWindows: number): string {
  if (napIndex === 0) return '🌙'
  if (napIndex > totalWindows - 1) return '🌙'
  return '💤'
}

function formatTimeDisplay(time: string | null): string {
  if (!time) return '--:--'
  const [h, m] = time.split(':').map(Number)
  const period = h < 12 ? '오전' : '오후'
  const displayH = h % 12 || 12
  return `${period} ${displayH}:${String(m).padStart(2, '0')}`
}

function calcDuration(start: string | null, end: string | null): string | null {
  if (!start || !end) return null
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let diff = (eh * 60 + em) - (sh * 60 + sm)
  if (diff < 0) diff += 24 * 60
  const hours = Math.floor(diff / 60)
  const mins = diff % 60
  if (hours === 0) return `${mins}분`
  if (mins === 0) return `${hours}시간`
  return `${hours}시간 ${mins}분`
}

export function SleepCard({ profileId, date, napIndex, totalWindows, onSleepChanged }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [sleepStart, setSleepStart] = useState<string | null>(null)
  const [sleepEnd, setSleepEnd] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const label = getLabel(napIndex, totalWindows)
  const emoji = getEmoji(napIndex, totalWindows)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/sleep-logs?profileId=${profileId}&date=${date}`
        )
        if (!res.ok) return
        const data = await res.json()
        const log = (data.sleepLogs as SleepLog[]).find(
          l => l.nap_index === napIndex
        )
        if (log) {
          setSleepStart(log.sleep_start)
          setSleepEnd(log.sleep_end)
        }
      } catch {
        // 실패 시 무시
      } finally {
        setLoaded(true)
      }
    }
    load()
  }, [profileId, date, napIndex])

  async function save(start: string | null, end: string | null) {
    setSaving(true)
    try {
      await fetch('/api/sleep-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          date,
          napIndex,
          sleepStart: start,
          sleepEnd: end,
        }),
      })
      onSleepChanged(napIndex, end)
    } catch {
      console.error('Failed to save sleep log')
    } finally {
      setSaving(false)
    }
  }

  function handleStartChange(value: string) {
    setSleepStart(value || null)
    save(value || null, sleepEnd)
  }

  function handleEndChange(value: string) {
    setSleepEnd(value || null)
    save(sleepStart, value || null)
  }

  const duration = calcDuration(sleepStart, sleepEnd)
  const hasData = sleepStart || sleepEnd

  return (
    <div
      className={`rounded-xl border-2 border-dashed transition-colors ${
        hasData ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-200 bg-gray-50/50'
      }`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span>{emoji}</span>
          <span className="text-sm font-medium text-gray-600">{label}</span>
          {hasData && duration && (
            <span className="text-xs text-indigo-400">{duration}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasData && !isOpen && (
            <span className="text-xs text-gray-400">
              {formatTimeDisplay(sleepStart)} → {formatTimeDisplay(sleepEnd)}
            </span>
          )}
          <span className="text-xs text-gray-400">{isOpen ? '접기' : '입력'}</span>
        </div>
      </button>

      {isOpen && loaded && (
        <div className="px-4 pb-4 flex gap-3 items-center">
          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">
              잠든 시간
            </label>
            <input
              type="time"
              value={sleepStart ?? ''}
              onChange={e => handleStartChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-300"
            />
          </div>
          <div className="text-gray-300 mt-5">→</div>
          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">
              {napIndex > totalWindows - 1 ? '잠든 시간' : '깬 시간'}
            </label>
            <input
              type="time"
              value={sleepEnd ?? ''}
              onChange={e => handleEndChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-300"
            />
          </div>
          {saving && (
            <span className="text-xs text-gray-300 mt-5">저장 중...</span>
          )}
        </div>
      )}
    </div>
  )
}
