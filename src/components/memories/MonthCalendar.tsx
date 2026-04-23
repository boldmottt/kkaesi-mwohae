'use client'
import { useEffect, useMemo, useRef } from 'react'
import { ActivityCategory } from '@/lib/supabase/types'

type CategoryCounts = Partial<Record<ActivityCategory, number>>

interface Props {
  year: number
  month: number
  selectedDate: string | null
  dayCategoryData: Record<string, CategoryCounts> // { '2026-04-15': { physical: 3, sensory: 2 } }
  onSelectDate: (date: string) => void
  onChangeMonth: (year: number, month: number) => void
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const CATEGORY_HEX: Record<ActivityCategory, string> = {
  physical: '#fb923c',
  sensory: '#a855f7',
  language: '#60a5fa',
  cognitive: '#4ade80',
  emotional: '#f472b6',
  other: '#9ca3af',
}

function getTodayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 겹치지 않는 랜덤 좌표 생성
function generateDotPositions(
  totalDots: number,
  width: number,
  height: number,
  dotRadius: number
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = []
  const margin = dotRadius + 0.5
  const minDist = dotRadius * 2 + 1
  let attempts = 0
  const maxAttempts = totalDots * 50

  while (positions.length < totalDots && attempts < maxAttempts) {
    attempts++
    const x = margin + Math.random() * (width - margin * 2)
    const y = margin + Math.random() * (height - margin * 2)
    const overlaps = positions.some(
      p => Math.hypot(p.x - x, p.y - y) < minDist
    )
    if (!overlaps) positions.push({ x, y })
  }
  return positions
}

// 시드 기반 의사 난수 (같은 날짜 = 같은 패턴)
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
    attempts++
    const x = margin + rand() * (width - margin * 2)
    const y = margin + rand() * (height - margin * 2)
    const overlaps = positions.some(
      p => Math.hypot(p.x - x, p.y - y) < minDist
    )
    if (!overlaps) positions.push({ x, y })
  }
  return positions
}

function dateSeed(dateStr: string): number {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) || 1
}

function DotCanvas({ dateStr, categories }: { dateStr: string; categories: CategoryCounts }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const totalActivities = Object.values(categories).reduce((s, c) => s + (c ?? 0), 0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || totalActivities === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = 28
    const h = 22
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    // 총 점 개수: 활동 수 비례, 3~25개
    const dotCount = Math.min(25, Math.max(3, Math.round(totalActivities * 1.5)))
    const dotRadius = 2

    const positions = generateDotPositionsSeeded(dotCount, w, h, dotRadius, dateSeed(dateStr))

    // 카테고리 비율에 따라 색상 배열 만들기
    const colorSlots: string[] = []
    const entries = Object.entries(categories) as [ActivityCategory, number][]
    for (const [cat, count] of entries) {
      const proportion = count / totalActivities
      const slots = Math.max(1, Math.round(proportion * dotCount))
      for (let i = 0; i < slots; i++) {
        colorSlots.push(CATEGORY_HEX[cat] ?? CATEGORY_HEX.other)
      }
    }
    // 길이 맞추기
    while (colorSlots.length < positions.length) {
      colorSlots.push(colorSlots[colorSlots.length - 1] ?? CATEGORY_HEX.other)
    }
    // 셔플 (시드 기반)
    const rand = seededRandom(dateSeed(dateStr) + 7)
    for (let i = colorSlots.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[colorSlots[i], colorSlots[j]] = [colorSlots[j], colorSlots[i]]
    }

    positions.forEach((pos, idx) => {
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, dotRadius, 0, Math.PI * 2)
      ctx.fillStyle = colorSlots[idx] ?? CATEGORY_HEX.other
      ctx.fill()
    })
  }, [dateStr, categories, totalActivities])

  if (totalActivities === 0) return null

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto"
      style={{ width: 28, height: 22 }}
    />
  )
}

export function MonthCalendar({
  year,
  month,
  selectedDate,
  dayCategoryData,
  onSelectDate,
  onChangeMonth,
}: Props) {
  const today = getTodayString()

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const startDow = firstDay.getDay()
    const daysInMonth = new Date(year, month, 0).getDate()

    const cells: (string | null)[] = []
    for (let i = 0; i < startDow; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push(dateStr)
    }
    return cells
  }, [year, month])

  function handlePrevMonth() {
    if (month === 1) onChangeMonth(year - 1, 12)
    else onChangeMonth(year, month - 1)
  }

  function handleNextMonth() {
    const todayDate = new Date()
    const todayYear = todayDate.getFullYear()
    const todayMonth = todayDate.getMonth() + 1
    if (year > todayYear || (year === todayYear && month >= todayMonth)) return
    if (month === 12) onChangeMonth(year + 1, 1)
    else onChangeMonth(year, month + 1)
  }

  const isFutureBlocked = (() => {
    const todayDate = new Date()
    return year > todayDate.getFullYear() ||
      (year === todayDate.getFullYear() && month >= todayDate.getMonth() + 1)
  })()

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="이전 달"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="font-bold text-gray-700">
          {year}년 {month}월
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          disabled={isFutureBlocked}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-20 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="다음 달"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(day => (
          <div
            key={day}
            className={`text-center text-xs font-medium py-1 ${
              day === '일' ? 'text-red-300' : day === '토' ? 'text-blue-300' : 'text-gray-400'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {calendarDays.map((dateStr, idx) => {
          if (!dateStr) {
            return <div key={`empty-${idx}`} className="h-14" />
          }

          const dayNum = parseInt(dateStr.split('-')[2], 10)
          const isToday = dateStr === today
          const isSelected = dateStr === selectedDate
          const isFuture = dateStr > today
          const categories = dayCategoryData[dateStr]
          const hasActivity = categories && Object.values(categories).some(c => (c ?? 0) > 0)
          const dow = new Date(
            parseInt(dateStr.split('-')[0]),
            parseInt(dateStr.split('-')[1]) - 1,
            dayNum
          ).getDay()

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => !isFuture && onSelectDate(dateStr)}
              disabled={isFuture}
              className={`h-14 flex flex-col items-center justify-start pt-1 rounded-lg transition-colors relative ${
                isSelected
                  ? 'bg-amber-50 ring-2 ring-amber-400'
                  : isToday
                    ? 'bg-amber-50/50'
                    : isFuture
                      ? 'text-gray-200 cursor-default'
                      : 'hover:bg-gray-50'
              }`}
            >
              <span
                className={`text-xs leading-none mb-0.5 ${
                  isSelected
                    ? 'text-amber-600 font-bold'
                    : isToday
                      ? 'text-amber-500 font-bold'
                      : isFuture
                        ? 'text-gray-200'
                        : dow === 0
                          ? 'text-red-400'
                          : dow === 6
                            ? 'text-blue-400'
                            : 'text-gray-600'
                }`}
              >
                {dayNum}
              </span>
              {hasActivity && categories && (
                <DotCanvas dateStr={dateStr} categories={categories} />
              )}
            </button>
          )
        })}
      </div>

      {/* 카테고리 범례 */}
      <div className="flex gap-3 justify-center mt-3 pt-3 border-t border-gray-100">
        {(['physical', 'sensory', 'language', 'cognitive', 'emotional'] as ActivityCategory[]).map(cat => (
          <span key={cat} className="flex items-center gap-1 text-[10px] text-gray-400">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: CATEGORY_HEX[cat] }}
            />
            {{
              physical: '신체',
              sensory: '감각',
              language: '언어',
              cognitive: '인지',
              emotional: '정서',
            }[cat]}
          </span>
        ))}
      </div>
    </div>
  )
}
