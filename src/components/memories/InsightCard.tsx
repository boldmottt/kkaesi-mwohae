'use client'
import { useEffect, useMemo, useRef } from 'react'
import { ActivityLog, ActivityCategory } from '@/lib/supabase/types'

interface Props {
  logs: ActivityLog[]
  dateCount: number
  isCustomRange: boolean
  onStartSelectDates: () => void
  onResetToMonthly: () => void
}

const CATEGORY_HEX: Record<ActivityCategory, string> = {
  physical: '#fb923c',
  sensory: '#a855f7',
  language: '#60a5fa',
  cognitive: '#4ade80',
  emotional: '#f472b6',
}

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  physical: '신체',
  sensory: '감각',
  language: '언어',
  cognitive: '인지',
  emotional: '정서',
}

const MIN_DAYS = 1

const gamjaStyle = { fontFamily: 'var(--font-gamja), cursive' }

function parseDurationMinutes(dur: string | null): number {
  if (!dur) return 0
  const match = dur.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function InsightDotCircle({ categories, size = 100 }: {
  categories: Record<ActivityCategory | string, number>
  size?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const total = Object.values(categories).reduce((s, c) => s + (c ?? 0), 0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || total === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, size, size)

    const dotCount = Math.min(80, Math.max(10, Math.round(total * 1.2)))
    const dotRadius = 3
    const center = size / 2
    const radius = size / 2 - dotRadius - 1

    const rand = seededRandom(42)
    const positions: { x: number; y: number }[] = []
    const minDist = dotRadius * 2 + 1
    let attempts = 0

    while (positions.length < dotCount && attempts < dotCount * 50) {
      const angle = rand() * Math.PI * 2
      const r = rand() * radius
      const x = center + r * Math.cos(angle)
      const y = center + r * Math.sin(angle)

      const tooClose = positions.some(p => Math.hypot(p.x - x, p.y - y) < minDist)
      if (!tooClose) {
        positions.push({ x, y })
      } else {
        attempts++
      }
    }

    const colorSlots: string[] = []
    const entries = Object.entries(categories) as [ActivityCategory | string, number][]
    for (const [cat, count] of entries) {
      const proportion = count / total
      const slots = Math.max(1, Math.round(proportion * dotCount))
      for (let i = 0; i < slots; i++) {
        colorSlots.push(CATEGORY_HEX[cat] ?? '#9ca3af')
      }
    }

    for (let i = colorSlots.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[colorSlots[i], colorSlots[j]] = [colorSlots[j], colorSlots[i]]
    }

    positions.forEach((pos, idx) => {
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, dotRadius, 0, Math.PI * 2)
      ctx.fillStyle = colorSlots[idx] ?? '#9ca3af'
      ctx.fill()
    })
  }, [categories, total, size])

  if (total === 0) return null

  return <canvas ref={canvasRef} className="rounded-full" />
}

export function InsightCard({ logs, dateCount, isCustomRange, onStartSelectDates, onResetToMonthly }: Props) {
  const meaningful = useMemo(() => {
    return logs.filter(l => l.did || (l.note ?? '').trim().length > 0 || l.rating !== 0)
  }, [logs])

  // 카테고리 집계
  const catCounts = useMemo(() => {
    const counts: Record<ActivityCategory | string, number> = {}
    for (const log of meaningful) {
      const cat = (log.category as ActivityCategory) ?? 'other'
      if (cat === 'other') continue
      counts[cat] = (counts[cat] ?? 0) + 1
    }
    return counts
  }, [meaningful])

  const totalActivities = meaningful.length

  const totalMinutes = useMemo(() => {
    return meaningful.reduce((s, l) => s + parseDurationMinutes(l.activity_duration), 0)
  }, [meaningful])

  // 선호/비선호 TOP3
  const { liked, disliked } = useMemo(() => {
    const likeMap: Record<string, number> = {}
    const dislikeMap: Record<string, number> = {}
    for (const log of meaningful) {
      if (log.rating === 1) {
        likeMap[log.activity_name] = (likeMap[log.activity_name] ?? 0) + 1
      }
      if (log.rating === -1) {
        dislikeMap[log.activity_name] = (dislikeMap[log.activity_name] ?? 0) + 1
      }
    }
    const liked = Object.entries(likeMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }))
    const disliked = Object.entries(dislikeMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }))
    return { liked, disliked }
  }, [meaningful])

  // 카테고리 균형 점수 (5개 카테고리가 균등할수록 높음)
  const balanceInfo = useMemo(() => {
    const cats: ActivityCategory[] = ['physical', 'sensory', 'language', 'cognitive', 'emotional']
    const total = cats.reduce((s, c) => s + (catCounts[c] ?? 0), 0)
    if (total === 0) return { score: 0, weakest: null as ActivityCategory | null, strongest: null as ActivityCategory | null }
    const ideal = total / 5
    let deviation = 0
    let weakest: ActivityCategory = cats[0]
    let strongest: ActivityCategory = cats[0]
    let minCount = Infinity
    let maxCount = -1
    for (const cat of cats) {
      const count = catCounts[cat] ?? 0
      deviation += Math.abs(count - ideal)
      if (count < minCount) { minCount = count; weakest = cat }
      if (count > maxCount) { maxCount = count; strongest = cat }
    }
    const maxDeviation = total * 4 / 5 * 2
    const score = Math.round((1 - deviation / maxDeviation) * 100)
    return { score, weakest, strongest }
  }, [catCounts])

  const avgMinutesPerDay = dateCount > 0 ? Math.round(totalMinutes / dateCount) : 0

  const notEnoughData = dateCount < MIN_DAYS

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm mb-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-amber-600 dark:text-amber-400" style={gamjaStyle}>
          {isCustomRange ? `${dateCount}일간의 인사이트` : '이번 달 인사이트'}
        </h3>

        <div className="flex gap-2">
          {isCustomRange && (
            <button
              onClick={onResetToMonthly}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              월 전체로
            </button>
          )}
          <button
            onClick={onStartSelectDates}
            className="text-xs text-violet-500 hover:text-violet-600"
          >
            날짜 선택
          </button>
        </div>
      </div>

      {notEnoughData ? (
        /* 데이터 부족 */
        <div className="text-center py-6">
          <span className="text-3xl">📊</span>
          <p className="text-sm text-gray-400 mt-2">데이터가 모이고 있어요</p>
          <p className="text-xs text-gray-300 mt-1">
            {MIN_DAYS - dateCount}일 더 기록하면 인사이트가 열려요!
          </p>

          {/* 미리보기: 간단한 통계만 */}
          {totalActivities > 0 && (
            <div className="mt-3 text-xs text-gray-400">
              지금까지 {dateCount}일간 {totalActivities}개 활동 · 총 {totalMinutes}분
            </div>
          )}
        </div>
      ) : (
        /* 인사이트 본문 */
        <div className="flex flex-col gap-4">
          {/* 카테고리 균형 */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2">발달 영역 균형</h4>

            {/* 점묘화 */}
            <div className="flex justify-center mb-3">
              <InsightDotCircle categories={catCounts} />
            </div>

            {/* 카테고리 바 */}
            <div className="flex flex-col gap-1.5 mb-2">
              {(['physical', 'sensory', 'language', 'cognitive', 'emotional'] as ActivityCategory[]).map(cat => {
                const count = catCounts[cat] ?? 0
                const total = Object.values(catCounts).reduce((s, c) => s + c, 0)
                if (count === 0 || total === 0) return null
                const pct = (count / total) * 100
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <span style={{ backgroundColor: CATEGORY_HEX[cat] }} className="w-1.5 h-3 rounded-full shrink-0" />
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CATEGORY_HEX[cat] }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 레전드 + 비율 */}
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {(['physical', 'sensory', 'language', 'cognitive', 'emotional'] as ActivityCategory[]).map(cat => {
                const count = catCounts[cat] ?? 0
                const total = Object.values(catCounts).reduce((s, c) => s + c, 0)
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={cat} className="text-xs text-gray-500">
                    {CATEGORY_LABELS[cat]} {pct}%
                  </div>
                )
              })}
            </div>

            {/* 균형 코멘트 */}
            {balanceInfo.weakest && balanceInfo.strongest && (
              <p className="text-xs text-gray-400 mt-2">
                {CATEGORY_LABELS[balanceInfo.strongest]}이(가) 가장 많고, {CATEGORY_LABELS[balanceInfo.weakest]}이(가) 부족해요
              </p>
            )}
          </div>

          {/* 선호/비선호 */}
          <div className="grid grid-cols-2 gap-3">
            {/* 좋아한 활동 */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-1.5">😊 좋아한 활동</h4>
              {liked.length === 0 ? (
                <p className="text-xs text-gray-300">아직 없어요</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {liked.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <span className="text-violet-400 font-bold">{i + 1}</span>
                      <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                      <span className="text-gray-400">×{item.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 싫어한 활동 */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-1.5">😟 싫어한 활동</h4>
              {disliked.length === 0 ? (
                <p className="text-xs text-gray-300">아직 없어요</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {disliked.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <span className="text-orange-400 font-bold">{i + 1}</span>
                      <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                      <span className="text-gray-400">×{item.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{totalActivities}</div>
              <div className="text-[10px] text-gray-400">총 활동</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{dateCount}</div>
              <div className="text-[10px] text-gray-400">활동한 날</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{avgMinutesPerDay}</div>
              <div className="text-[10px] text-gray-400">일 평균</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
