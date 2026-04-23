'use client'
import { useEffect, useMemo, useRef } from 'react'
import { ActivityLog, ActivityCategory } from '@/lib/supabase/types'

interface Props {
  date: string
  logs: ActivityLog[]
  onClose: () => void
}

const DAY_LABELS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

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

const CATEGORY_SHORT: Record<ActivityCategory, string> = {
  physical: '체',
  sensory: '감',
  language: '어',
  cognitive: '지',
  emotional: '정',
}

function formatDateHeader(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return `${m}월 ${d}일 ${DAY_LABELS[dt.getDay()]}`
}

function parseDurationMinutes(dur: string | null): number {
  if (!dur) return 0
  const match = dur.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

function RatingIcon({ rating }: { rating: number }) {
  if (rating === 1) return '😊'
  if (rating === -1) return '😟'
  return null
}

// 시드 기반 난수
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function dateSeed(dateStr: string): number {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function DotCircle({ categories, seed }: {
  categories: Record<ActivityCategory | string, number>
  seed: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const total = Object.values(categories).reduce((s, c) => s + (c ?? 0), 0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || total === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const size = 80
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, size, size)

    const dotCount = Math.min(40, Math.max(5, Math.round(total * 1.5)))
    const dotRadius = 2.5
    const center = size / 2
    const radius = size / 2 - dotRadius - 1

    // 원 안에 도트 배치
    const rand = seededRandom(seed)
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

    // 색상 슬롯 생성 (비율에 따라) + 셔플
    const colorSlots: string[] = []
    const entries = Object.entries(categories) as [ActivityCategory | string, number][]
    for (const [cat, count] of entries) {
      const proportion = count / total
      const slots = Math.max(1, Math.round(proportion * dotCount))
      for (let i = 0; i < slots; i++) {
        colorSlots.push(CATEGORY_HEX[cat] ?? '#9ca3af')
      }
    }

    // 셔플 (Fisher-Yates)
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
  }, [categories, seed, total])

  if (total === 0) return null

  return (
    <canvas ref={canvasRef} className="rounded-full" />
  )
}

export function DayDetailView({ date, logs, onClose }: Props) {
  // 전체 시간대 추출 (비어있는 시간대 포함)
  const maxWindow = useMemo(() => {
    if (logs.length === 0) return -1
    return Math.max(...logs.map(l => l.window_index))
  }, [logs])

  const windowGroups = useMemo(() => {
    if (maxWindow < 0) return []
    const groups: { windowIndex: number; logs: ActivityLog[] }[] = []
    for (let w = 0; w <= maxWindow; w++) {
      groups.push({
        windowIndex: w,
        logs: logs.filter(l => l.window_index === w),
      })
    }
    return groups
  }, [logs, maxWindow])

  const categorySummary = useMemo(() => {
    const counts: Record<ActivityCategory | string, number> = {}
    for (const log of logs) {
      const cat = (log.category as ActivityCategory) ?? 'other'
      counts[cat] = (counts[cat] ?? 0) + 1
    }
    return counts
  }, [logs])

  const totalMinutes = useMemo(() => {
    return logs.reduce((sum, l) => sum + parseDurationMinutes(l.activity_duration), 0)
  }, [logs])

  const totalActivities = logs.length

  const backButton = (
    <button
      onClick={onClose}
      className="text-sm text-amber-500 hover:text-amber-600 flex items-center gap-1"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      캘린더로 돌아가기
    </button>
  )

  return (
    <div className="min-h-screen bg-[#FFF8F0] dark:bg-gray-900 dark:text-white">
      {/* 상단 바 */}
      <div className="sticky top-0 bg-[#FFF8F0] dark:bg-gray-900 z-10 px-6 pt-4 pb-2 border-b border-amber-100 dark:border-gray-700">
        {backButton}
      </div>

      <div className="px-6 pb-8">
        {/* 날짜 헤더 */}
        <div className="py-4">
          <h2 className="text-xl font-bold text-amber-700 dark:text-amber-400">
            {formatDateHeader(date)}
          </h2>
        </div>

        {/* AI 요약 자리 (Phase 3에서 채울 예정) */}
        <div className="mb-4 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-dashed border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-400 dark:text-gray-300">AI 한줄 요약이 들어갈 자리예요</p>
        </div>

        {/* 타임라인 */}
        {windowGroups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 dark:text-gray-300 text-sm">이 날은 기록된 활동이 없어요</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* 세로 타임라인 */}
            <div className="relative pl-6" style={{ borderLeft: '2px solid #f59e0b33' }}>
              {windowGroups.map(({ windowIndex, logs: wLogs }) => {
                const wMinutes = wLogs.reduce((s, l) => s + parseDurationMinutes(l.activity_duration), 0)
                const wCount = wLogs.length

                return (
                  <div key={windowIndex} className="relative mb-4 last:mb-0">
                    {/* 타임라인 도트 */}
                    <div className="absolute -left-[30px] top-2 w-3 h-3 bg-amber-400 dark:bg-amber-500 rounded-full" />

                    {/* 시간대 라벨 */}
                    <div className="text-xs text-amber-500 dark:text-amber-400 font-semibold mb-2">
                      {windowIndex + 1}번째 깨시 시간
                    </div>

                    {wLogs.length === 0 ? (
                      <div className="text-sm text-gray-400 dark:text-gray-300 italic py-2">
                        이 시간대에는 기록이 없어요
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {wLogs.map(log => {
                          const cat = (log.category as ActivityCategory) ?? 'other'
                          return (
                            <div key={log.id} className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm">
                              <div className="flex items-start gap-2">
                                {/* 카테고리 컬러 보더 */}
                                <div className="w-1 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_HEX[cat] }} />
                                <div className="min-w-0 flex-1">
                                  {/* 활동명 (카테고리 컬러) */}
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span style={{ color: CATEGORY_HEX[cat] }} className="font-semibold text-sm">
                                      {log.activity_name}
                                    </span>
                                    <RatingIcon rating={log.rating} />
                                    {log.activity_duration && (
                                      <span className="text-xs text-gray-400 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                        {log.activity_duration}
                                      </span>
                                    )}
                                    {log.is_custom && (
                                      <span className="text-xs">✋</span>
                                    )}
                                  </div>

                                  {/* 메모 박스 */}
                                  {log.note && log.note.trim() && (
                                    <div className="mt-1.5 text-xs bg-[#FFF0E8] dark:bg-gray-700 rounded-lg px-3 py-1.5 text-gray-600 dark:text-gray-200 whitespace-pre-wrap">
                                      {log.note}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* 시간대 통계 */}
                    {wLogs.length > 0 && (
                      <div className="text-xs text-gray-400 dark:text-gray-300 mt-1.5">
                        활동 {wCount}개 · 총 {wMinutes}분
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 일일 통계 */}
        {totalActivities > 0 && (
          <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-3">오늘 하루</h3>

            {/* 점묘화 원형 */}
            <div className="flex justify-center mb-3">
              <DotCircle categories={categorySummary} seed={dateSeed(date)} />
            </div>

            {/* 카테고리 레전드 */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mb-3">
              {(['physical', 'sensory', 'language', 'cognitive', 'emotional'] as ActivityCategory[]).map(cat => {
                const count = categorySummary[cat]
                if (!count) return null
                return (
                  <div key={cat} className="flex items-center gap-1">
                    <span style={{ backgroundColor: CATEGORY_HEX[cat] }} className="w-2 h-2 rounded-full" />
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {CATEGORY_SHORT[cat]} {count}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* 수치 요약 */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-300">
              활동 {totalActivities}개 · 총 {totalMinutes}분
            </div>
          </div>
        )}

        {/* 하단 돌아가기 */}
        <div className="pt-4 pb-2">
          {backButton}
        </div>
      </div>
    </div>
  )
}
