'use client'
import { useState, useEffect } from 'react'
import { SleepLog } from '@/lib/supabase/types'

interface Props {
  profileId: string
  date: string
  napIndex: number
  totalWindows: number
  onSleepChanged: (napIndex: number, sleepStart: string | null, sleepEnd: string | null) => void
}

type CardType = 'overnight' | 'nap' | 'bedtime'

function getCardType(napIndex: number, totalWindows: number): CardType {
  if (napIndex === 0) return 'overnight'
  if (napIndex >= totalWindows) return 'bedtime'
  return 'nap'
}

function getLabel(cardType: CardType, napIndex: number): string {
  if (cardType === 'overnight') return '간밤 수면'
  if (cardType === 'bedtime') return '취침'
  return `${napIndex}번째 낮잠`
}

function getEmoji(cardType: CardType): string {
  if (cardType === 'nap') return '💤'
  return '🌙'
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

  const cardType = getCardType(napIndex, totalWindows)
  const label = getLabel(cardType, napIndex)
  const emoji = getEmoji(cardType)

  const showStartInput = cardType === 'nap' || cardType === 'bedtime'
  const showEndInput = cardType === 'nap' || cardType === 'overnight'

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
          // 로드된 깬 시간을 부모에도 즉시 알려서 start_time 오버라이드 적용
          onSleepChanged(napIndex, log.sleep_start ?? null, log.sleep_end ?? null)
        }
      } catch {
        // 실패 시 무시
      } finally {
        setLoaded(true)
      }
    }
    load()
  // onSleepChanged는 useCallback이므로 deps에 포함해도 무한루프 없음
  }, [profileId, date, napIndex, showEndInput, onSleepChanged])

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
      onSleepChanged(napIndex, start, end)
    } catch {
      // 실패 시 무시
    } finally {
      setSaving(false)
    }
  }

  function handleStartChange(value: string) {
    const next = value || null
    setSleepStart(next)
    save(next, sleepEnd)
  }

  function handleEndChange(value: string) {
    const next = value || null
    setSleepEnd(next)
    save(sleepStart, next)
  }

  function handleClearStart() {
    setSleepStart(null)
    save(null, sleepEnd)
  }

  function handleClearEnd() {
    setSleepEnd(null)
    save(sleepStart, null)
  }

  function getSummaryText(): string | null {
    if (cardType === 'overnight' && sleepEnd) {
      return `깬 시간 ${formatTimeDisplay(sleepEnd)}`
    }
    if (cardType === 'bedtime' && sleepStart) {
      return `잠든 시간 ${formatTimeDisplay(sleepStart)}`
    }
    if (cardType === 'nap') {
      if (sleepStart && sleepEnd) {
        return `${formatTimeDisplay(sleepStart)} → ${formatTimeDisplay(sleepEnd)}`
      }
      if (sleepStart) return `잠든 시간 ${formatTimeDisplay(sleepStart)}`
      if (sleepEnd) return `깬 시간 ${formatTimeDisplay(sleepEnd)}`
    }
    return null
  }

  const duration = cardType === 'nap' ? calcDuration(sleepStart, sleepEnd) : null
  const hasData = (showStartInput && sleepStart) || (showEndInput && sleepEnd)
  const summaryText = getSummaryText()

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
          {hasData && !isOpen && summaryText && (
            <span className="text-xs text-gray-400">{summaryText}</span>
          )}
          <span className="text-xs text-gray-400">{isOpen ? '접기' : '입력'}</span>
        </div>
      </button>

      {isOpen && loaded && (
        <div className="px-4 pb-4 flex gap-3 items-end">
          {showStartInput && (
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">잠든 시간</label>
              <div className="flex gap-1 items-center">
                <input
                  type="time"
                  value={sleepStart ?? ''}
                  onChange={e => handleStartChange(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-300"
                />
                {sleepStart && (
                  <button
                    type="button"
                    onClick={handleClearStart}
                    className="text-gray-300 hover:text-gray-500 text-lg leading-none px-1"
                    aria-label="잠든 시간 지우기"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          )}
          {showStartInput && showEndInput && (
            <div className="text-gray-300 pb-2.5">→</div>
          )}
          {showEndInput && (
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">깬 시간</label>
              <div className="flex gap-1 items-center">
                <input
                  type="time"
                  value={sleepEnd ?? ''}
                  onChange={e => handleEndChange(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-300"
                />
                {sleepEnd && (
                  <button
                    type="button"
                    onClick={handleClearEnd}
                    className="text-gray-300 hover:text-gray-500 text-lg leading-none px-1"
                    aria-label="깬 시간 지우기"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          )}
          {saving && (
            <span className="text-xs text-gray-300 pb-2.5">저장 중...</span>
          )}
        </div>
      )}
    </div>
  )
}
