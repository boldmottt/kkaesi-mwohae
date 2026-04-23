'use client'
import { useEffect, useMemo, useRef } from 'react'
import { ActivityCategory } from '@/lib/supabase/types'

type CategoryCounts = Record<ActivityCategory | string, number>

interface Props {
  year: number
  month: number
  selectedDate: string | null
  dayCategoryData: Record<string, CategoryCounts>
  onSelectDate: (date: string) => void
  onChangeMonth: (year: number, month: number) => void
  // 인사이트 모드
  insightMode?: boolean
  insightDates?: Set<string>
  onToggleInsightDate?: (date: string) => void
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const CATEGORY_HEX: Record<ActivityCategory, string> = {
  physical: '#fb923c',
  sensory: '#a855f7',
  language: '#60a5fa',
  cognitive: '#4ade80',
  emotional: '#f472b6',
}

const CATEGORY_SHORT: Record<ActivityCategory, string> = {
  physical: '체',
  sensory: '감',
  language: '어',
  cognitive: '지',
  emotional: '정',
}

function getTodayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateDotPositionsSeeded(
  totalDots: number,
  width: number,
  height: number,
  dotRadius: number,
  seed: number
): { x: number; y: number }[] {
  const rand = seededRandom(seed)
  const positions: { x: number; y: number }[] = []
  const margin = dotRadius + 0.5
  const minDist = dotRadius * 2 + 1
  let attempts = 0
  const maxAttempts = totalDots * 50

  while (positions.length < totalDots && attempts < maxAttempts) {
    const x = margin + rand() * (width - 2 * margin)
    const y = margin + rand() * (height - 2 * margin)
    const tooClose = positions.some(p => Math.hypot(p.x - x, p.y - y) < minDist)
    if (!tooClose) {
      positions.push({ x, y })
    } else {
      attempts++
    }
  }
  return positions
}

function dateSeed(dateStr: string): number {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function ActivityDotCanvas({ dateStr, categories }: {
  dateStr: string
  categories: CategoryCounts | null
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  if (!categories) return null
  const totalActivities = Object.values(categories).reduce((s, c) => s + (c ?? 0), 0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || totalActivities === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = 24
    const h = 16
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    const dotCount = Math.min(20, Math.max(3, Math.round(totalActivities * 1.2)))
    const dotRadius = 1.5

    const positions = generateDotPositionsSeeded(dotCount, w, h, dotRadius, dateSeed(dateStr))

    const colorSlots: string[] = []
    const entries = Object.entries(categories) as [ActivityCategory | string, number][]
    for (const [cat, count] of entries) {
      const proportion = count / totalActivities
      const slots = Math.max(1, Math.round(proportion * dotCount))
      for (let i = 0; i < slots; i++) {
        colorSlots.push(CATEGORY_HEX[cat] ?? CATEGORY_HEX.physical)
      }
    }

    const rand = seededRandom(dateSeed(dateStr))
    for (let i = colorSlots.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[colorSlots[i], colorSlots[j]] = [colorSlots[j], colorSlots[i]]
    }

    positions.forEach((pos, idx) => {
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, dotRadius, 0, Math.PI * 2)
      ctx.fillStyle = colorSlots[idx] ?? CATEGORY_HEX.physical
      ctx.fill()
    })
  }, [dateStr, categories, totalActivities])

  if (totalActivities === 0) return null

  return (
    <canvas ref={canvasRef} className="absolute bottom-0.5 left-1/2 -translate-x-1/2" />
  )
}

export function MonthCalendar({
  year,
  month,
  selectedDate,
  dayCategoryData,
  onSelectDate,
  onChangeMonth,
  insightMode = false,
  insightDates,
  onToggleInsightDate,
}: Props) {
  const today = getTodayString()

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const startDow = firstDay.getDay()
    const daysInMonth = new Date(year, month, 0).getDate()

    const cells: (string | null)[] = []
    for (let i = 0; i < startDow; i++) {
      cells.push(null)
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    }
    return cells
  }, [year, month])

  const isPastMonth = (() => {
    const todayDate = new Date()
    if (year < todayDate.getFullYear()) return true
    if (year === todayDate.getFullYear() && month < todayDate.getMonth() + 1) return true
    return false
  })()

  const isFutureBlocked = (() => {
    const todayDate = new Date()
    return year > todayDate.getFullYear() ||
      (year === todayDate.getFullYear() && month >= todayDate.getMonth() + 1)
  })()

  return (
    <div className="mb-6">
      {/* 헤더 — 감자꽃 폰트 */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => {
            if (isFutureBlocked) return
            if (month === 1) onChangeMonth(year - 1, 12)
            else onChangeMonth(year, month - 1)
          }}
          disabled={isFutureBlocked}
          className="text-amber-500 hover:text-amber-600 disabled:opacity-30 p-1"
          aria-label="이전 달"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <h2 className="text-lg font-bold text-amber-600">
          {year}년 {month}월
        </h2>

        <button
          onClick={() => {
            if (isFutureBlocked) return
            if (month === 12) onChangeMonth(year + 1, 1)
            else onChangeMonth(year, month + 1)
          }}
          disabled={isFutureBlocked}
          className="text-amber-500 hover:text-amber-600 disabled:opacity-30 p-1"
          aria-label="다음 달"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* 인사이트 모드 안내 */}
      {insightMode && (
        <div className="text-center text-xs text-violet-500 mb-2">
          인사이트를 볼 날짜를 선택하세요 · {insightDates?.size ?? 0}일 선택됨
        </div>
      )}

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-0 mb-1">
        {DAY_LABELS.map(day => (
          <div key={day} className="text-center text-xs text-gray-400 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-0">
        {calendarDays.map((dateStr, idx) => {
          if (!dateStr) {
            return <div key={`empty-${idx}`} className="h-12" />
          }

          const dayNum = parseInt(dateStr.split('-')[2], 10)
          const isToday = dateStr === today
          const isSelected = dateStr === selectedDate
          const isFuture = dateStr > today
          const categories = dayCategoryData[dateStr]
          const hasActivity = categories && Object.values(categories).some(c => (c ?? 0) > 0)
          const isInsightSelected = insightMode && insightDates?.has(dateStr)

          const handleClick = () => {
            if (isFuture) return
            if (insightMode) {
              // 인사이트 모드: 활동이 있는 날만 선택 가능
              if (hasActivity && onToggleInsightDate) {
                onToggleInsightDate(dateStr)
              }
            } else {
              onSelectDate(dateStr)
            }
          }

          return (
            <button
              key={dateStr}
              onClick={handleClick}
              disabled={isFuture && !insightMode}
              className={`h-12 flex flex-col items-center justify-start pt-1 rounded-lg transition-colors relative ${
                isInsightSelected
                  ? 'bg-violet-100 dark:bg-violet-900/30 ring-2 ring-violet-400'
                  : isSelected
                    ? 'bg-amber-50 ring-1 ring-amber-300'
                    : isFuture
                      ? 'text-gray-200 cursor-default'
                      : hasActivity
                        ? 'hover:bg-gray-50'
                        : insightMode
                          ? 'opacity-30 cursor-default'
                          : 'hover:bg-gray-50'
              }`}
            >
              <span className={`text-sm ${isToday ? 'font-bold text-amber-600' : ''}`}>
                {dayNum}
              </span>
              {/* 오늘 표시: 작은 밑줄 */}
              {isToday && !insightMode && (
                <div className="w-3 h-0.5 bg-amber-400 rounded-full mt-0.5" />
              )}
              {/* 인사이트 선택 체크 */}
              {isInsightSelected && (
                <div className="absolute top-0.5 right-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
              {/* 점묘화 */}
              {hasActivity && categories && (
                <ActivityDotCanvas dateStr={dateStr} categories={categories} />
              )}
            </button>
          )
        })}
      </div>

      {/* 범례 — 최소화 */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {(['physical', 'sensory', 'language', 'cognitive', 'emotional'] as ActivityCategory[]).map(cat => (
          <div key={cat} className="flex items-center gap-0.5">
            <span style={{ backgroundColor: CATEGORY_HEX[cat] }} className="w-1.5 h-1.5 rounded-full inline-block" />
            <span className="text-[9px] text-gray-500">{CATEGORY_SHORT[cat]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
