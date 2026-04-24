'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityLog, ActivityCategory } from '@/lib/supabase/types'

interface Props {
  logs: ActivityLog[]
  dateCount: number
  isCustomRange: boolean
  profileId: string
  month: string
  onStartSelectDates: () => void
  onResetToMonthly: () => void
}

const CATS: ActivityCategory[] = ['physical', 'sensory', 'language', 'cognitive', 'emotional']

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

const CROSS_DOMAIN_SUGGESTIONS: Record<ActivityCategory, { activity: string; description: string; crosses: ActivityCategory[] }[]> = {
  physical: [
    { activity: '이불 산 오르기', description: '이불을 쌓아 올라가고 내려오기 — 대근육 발달과 공간감각', crosses: ['sensory'] },
    { activity: '풍선 배구', description: '풍선을 치며 놀기 — 눈손 협응과 신체 활동', crosses: ['cognitive'] },
    { activity: '동물 흉내 걷기', description: '곰걸음, 펭귄걸음 등 — 신체놀이 + 언어표현', crosses: ['language'] },
  ],
  sensory: [
    { activity: '물감 손도장', description: '손에 물감을 묻혀 찍기 — 촉각 자극과 색 인지', crosses: ['cognitive'] },
    { activity: '쌀 놀이', description: '쌀을 만지고 컵에 담기 — 촉감 탐색과 소근육', crosses: ['physical'] },
    { activity: '소리 탐색', description: '다양한 물건 두드리며 소리 듣기 — 청각과 언어 연결', crosses: ['language'] },
  ],
  language: [
    { activity: '그림책 읽어주기', description: '그림 가리키며 이름 말하기 — 어휘력과 인지 발달', crosses: ['cognitive'] },
    { activity: '노래 부르며 율동', description: '동요에 맞춰 몸 움직이기 — 언어리듬과 신체표현', crosses: ['physical'] },
    { activity: '감정 표현 놀이', description: '"기뻐요/슬퍼요" 표정 따라하기 — 언어와 정서 연결', crosses: ['emotional'] },
  ],
  cognitive: [
    { activity: '컵 쌓기', description: '컵을 크기순으로 쌓기 — 분류, 순서 개념과 소근육', crosses: ['physical'] },
    { activity: '까꿍 변형 놀이', description: '물건 숨기고 찾기 — 대상영속성과 정서적 안정', crosses: ['emotional'] },
    { activity: '색깔 분류', description: '같은 색 물건 모으기 — 인지력과 감각 탐색', crosses: ['sensory'] },
  ],
  emotional: [
    { activity: '안아주며 노래', description: '부드럽게 안고 자장가 — 정서 안정과 언어 노출', crosses: ['language'] },
    { activity: '거울 놀이', description: '거울 보며 표정 짓기 — 자아 인식과 감각 자극', crosses: ['sensory'] },
    { activity: '스킨십 마사지', description: '부드럽게 만져주기 — 정서 교감과 촉각 발달', crosses: ['physical'] },
  ],
}

function PentagonRadar({ values, size = 180 }: { values: Record<ActivityCategory, number>; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, size, size)

    const center = size / 2
    const maxRadius = size / 2 - 30
    const angleStep = (Math.PI * 2) / 5
    const startAngle = -Math.PI / 2

    function getPoint(index: number, radius: number) {
      const angle = startAngle + index * angleStep
      return { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) }
    }

    for (const level of [0.2, 0.4, 0.6, 0.8, 1.0]) {
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const pt = getPoint(i, maxRadius * level)
        if (i === 0) ctx.moveTo(pt.x, pt.y)
        else ctx.lineTo(pt.x, pt.y)
      }
      ctx.closePath()
      ctx.strokeStyle = level === 1.0 ? 'rgba(156,163,175,0.4)' : 'rgba(156,163,175,0.15)'
      ctx.lineWidth = level === 1.0 ? 1 : 0.5
      ctx.stroke()
    }

    const maxVal = Math.max(...CATS.map(cat => Math.max(0.05, values[cat] ?? 0)))

    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const cat = CATS[i]
      const val = Math.max(0.05, values[cat] ?? 0)
      const r = (val / maxVal) * maxRadius
      const pt = getPoint(i, r)
      if (i === 0) ctx.moveTo(pt.x, pt.y)
      else ctx.lineTo(pt.x, pt.y)
    }
    ctx.closePath()
    ctx.fillStyle = 'rgba(168,85,247,0.12)'
    ctx.fill()
    ctx.strokeStyle = '#a855f7'
    ctx.lineWidth = 2
    ctx.stroke()

    for (let i = 0; i < 5; i++) {
      const cat = CATS[i]
      const val = Math.max(0.05, values[cat] ?? 0)
      const r = (val / maxVal) * maxRadius
      const pt = getPoint(i, r)

      ctx.beginPath()
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2)
      ctx.fillStyle = CATEGORY_HEX[cat]
      ctx.fill()

      const labelPt = getPoint(i, maxRadius + 16)
      ctx.fillStyle = CATEGORY_HEX[cat]
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(CATEGORY_LABELS[cat], labelPt.x, labelPt.y)
    }
  }, [values, size])

  return <canvas ref={canvasRef} className="block" />
}

function WeeklyTrendBars({ logs }: { logs: ActivityLog[] }) {
  const weekData = useMemo(() => {
    const weeks: { label: string; counts: Record<ActivityCategory, number>; total: number }[] = []
    const meaningful = logs.filter(l => l.did || (l.note ?? '').trim().length > 0 || l.rating !== 0)

    for (let w = 0; w < 4; w++) {
      const counts: Record<ActivityCategory, number> = {}
      let total = 0
      for (const log of meaningful) {
        const day = parseInt(log.log_date.split('-')[2], 10)
        const weekIdx = Math.floor((day - 1) / 7)
        if (weekIdx !== w) continue
        const cat = (log.category as ActivityCategory) ?? 'other'
        if (cat === 'other') continue
        counts[cat] = (counts[cat] ?? 0) + 1
        total++
      }
      weeks.push({ label: `${w + 1}주`, counts, total })
    }
    return weeks
  }, [logs])

  const maxTotal = Math.max(...weekData.map(w => w.total), 1)
  const hasAnyData = weekData.some(w => w.total > 0)
  if (!hasAnyData) return null

  return (
    <div className="mt-4">
      <h4 className="text-xs font-semibold text-gray-500 mb-2">주간 트렌드</h4>
      <div className="flex items-end gap-3 justify-center" style={{ height: 100 }}>
        {weekData.map((week, idx) => {
          const barHeight = week.total > 0 ? Math.max(12, (week.total / maxTotal) * 80) : 4
          return (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div className="w-8 rounded-t-md overflow-hidden flex flex-col-reverse" style={{ height: barHeight }}>
                {week.total === 0 ? (
                  <div className="h-full bg-gray-200 dark:bg-gray-600" />
                ) : (
                  CATS.map(cat => {
                    const count = week.counts[cat] ?? 0
                    if (count === 0) return null
                    const pct = (count / week.total) * 100
                    return <div key={cat} style={{ backgroundColor: CATEGORY_HEX[cat], height: `${pct}%` }} />
                  })
                )}
              </div>
              <span className="text-[10px] text-gray-400">{week.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CrossDomainSuggestions({ weakest, catCounts }: { weakest: ActivityCategory | null; catCounts: Record<ActivityCategory, number> }) {
  if (!weakest) return null

  const suggestions = CROSS_DOMAIN_SUGGESTIONS[weakest]
  if (!suggestions || suggestions.length === 0) return null

  // 가장 부족한 2개 영역의 추천을 섞어서 보여주기
  const sorted = CATS.filter(c => c !== 'other').sort((a, b) => (catCounts[a] ?? 0) - (catCounts[b] ?? 0))
  const weakTwo = sorted.slice(0, 2)
  const picks: { activity: string; description: string; crosses: ActivityCategory[]; forCat: ActivityCategory }[] = []
  for (const cat of weakTwo) {
    const catSuggestions = CROSS_DOMAIN_SUGGESTIONS[cat]
    if (catSuggestions && catSuggestions.length > 0) {
      picks.push({ ...catSuggestions[0], forCat: cat })
    }
  }

  if (picks.length === 0) return null

  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-500 mb-2">💡 이런 활동은 어때요?</h4>
      <div className="flex flex-col gap-2">
        {picks.map((pick, idx) => (
          <div key={idx} className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORY_HEX[pick.forCat] }}
              />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                {pick.activity}
              </span>
              <div className="flex gap-0.5 ml-auto">
                {pick.crosses.map(c => (
                  <span
                    key={c}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: CATEGORY_HEX[c] }}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{pick.description}</p>
            <div className="flex gap-1 mt-1.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: CATEGORY_HEX[pick.forCat] + '20', color: CATEGORY_HEX[pick.forCat] }}>
                {CATEGORY_LABELS[pick.forCat]}
              </span>
              {pick.crosses.map(c => (
                <span key={c} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: CATEGORY_HEX[c] + '20', color: CATEGORY_HEX[c] }}>
                  {CATEGORY_LABELS[c]}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function InsightCard({ logs, dateCount, isCustomRange, profileId, month, onStartSelectDates, onResetToMonthly }: Props) {
  const [aiComment, setAiComment] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    if (!profileId || !month || isCustomRange) {
      setAiComment(null)
      return
    }
    let cancelled = false
    async function load() {
      setAiLoading(true)
      try {
        const res = await fetch(`/api/monthly-insight?profileId=${profileId}&month=${month}`)
        if (cancelled) return
        const data = await res.json()
        if (!cancelled) setAiComment(data.comment ?? null)
      } catch {
        // ignore
      } finally {
        if (!cancelled) setAiLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [profileId, month, isCustomRange])

  const meaningful = useMemo(() => {
    return logs.filter(l => l.did || (l.note ?? '').trim().length > 0 || l.rating !== 0)
  }, [logs])

  const catCounts = useMemo(() => {
    const counts: Record<ActivityCategory, number> = {}
    for (const log of meaningful) {
      const cat = (log.category as ActivityCategory) ?? 'other'
      if (cat === 'other') continue
      counts[cat] = (counts[cat] ?? 0) + 1
    }
    return counts
  }, [meaningful])

  const radarValues = useMemo(() => {
    const total = CATS.reduce((s, c) => s + (catCounts[c] ?? 0), 0)
    if (total === 0) return Object.fromEntries(CATS.map(c => [c, 0])) as Record<ActivityCategory, number>
    const ratios = CATS.map(c => (catCounts[c] ?? 0) / total)
    const maxRatio = Math.max(...ratios, 0.01)
    const result: Record<ActivityCategory, number> = {}
    CATS.forEach((cat, i) => { result[cat] = ratios[i] / maxRatio })
    return result as Record<ActivityCategory, number>
  }, [catCounts])

  const totalActivities = meaningful.length
  const totalMinutes = useMemo(() => meaningful.reduce((s, l) => s + parseDurationMinutes(l.activity_duration), 0), [meaningful])

  const { liked, disliked } = useMemo(() => {
    const likeMap: Record<string, number> = {}
    const dislikeMap: Record<string, number> = {}
    for (const log of meaningful) {
      if (log.rating === 1) likeMap[log.activity_name] = (likeMap[log.activity_name] ?? 0) + 1
      if (log.rating === -1) dislikeMap[log.activity_name] = (dislikeMap[log.activity_name] ?? 0) + 1
    }
    return {
      liked: Object.entries(likeMap).sort(([, a], [, b]) => b - a).slice(0, 3).map(([name, count]) => ({ name, count })),
      disliked: Object.entries(dislikeMap).sort(([, a], [, b]) => b - a).slice(0, 3).map(([name, count]) => ({ name, count })),
    }
  }, [meaningful])

  const balanceInfo = useMemo(() => {
    const total = CATS.reduce((s, c) => s + (catCounts[c] ?? 0), 0)
    if (total === 0) return { score: 0, weakest: null as ActivityCategory | null, strongest: null as ActivityCategory | null, comment: '' }
    const ideal = total / 5
    let deviation = 0
    let weakest: ActivityCategory = CATS[0]
    let strongest: ActivityCategory = CATS[0]
    let minCount = Infinity
    let maxCount = -1
    for (const cat of CATS) {
      const count = catCounts[cat] ?? 0
      deviation += Math.abs(count - ideal)
      if (count < minCount) { minCount = count; weakest = cat }
      if (count > maxCount) { maxCount = count; strongest = cat }
    }
    const maxDeviation = total * (4 / 5) * 2
    const score = Math.max(0, Math.round((1 - deviation / maxDeviation) * 100))
    let comment = ''
    if (score >= 80) comment = '다양한 영역을 골고루 경험하고 있어요! 👏'
    else if (score >= 60) comment = `전반적으로 좋아요. ${CATEGORY_LABELS[weakest]} 활동을 조금 더 해보면 완벽해요`
    else if (score >= 40) comment = `${CATEGORY_LABELS[strongest]} 위주로 하고 있어요. ${CATEGORY_LABELS[weakest]} 활동도 시도해보세요`
    else comment = `${CATEGORY_LABELS[strongest]}에 많이 치우쳐 있어요. ${CATEGORY_LABELS[weakest]} 영역을 늘려보세요`
    return { score, weakest, strongest, comment }
  }, [catCounts])

  const avgMinutesPerDay = dateCount > 0 ? Math.round(totalMinutes / dateCount) : 0
  const notEnoughData = dateCount < MIN_DAYS

  const scoreColorClass =
    balanceInfo.score >= 80 ? 'text-green-500' :
    balanceInfo.score >= 60 ? 'text-amber-500' :
    balanceInfo.score >= 40 ? 'text-orange-500' : 'text-red-400'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-amber-600 dark:text-amber-400" style={gamjaStyle}>
          {isCustomRange ? `${dateCount}일간의 인사이트` : '이번 달 인사이트'}
        </h3>
        <div className="flex gap-2">
          {isCustomRange && (
            <button onClick={onResetToMonthly} className="text-xs text-gray-400 hover:text-gray-600">월 전체로</button>
          )}
          <button onClick={onStartSelectDates} className="text-xs text-violet-500 hover:text-violet-600">날짜 선택</button>
        </div>
      </div>

      {notEnoughData ? (
        <div className="text-center py-6">
          <span className="text-3xl">📊</span>
          <p className="text-sm text-gray-400 mt-2">데이터가 모이고 있어요</p>
          <p className="text-xs text-gray-300 mt-1">{MIN_DAYS - dateCount}일 더 기록하면 인사이트가 열려요!</p>
          {totalActivities > 0 && (
            <div className="mt-3 text-xs text-gray-400">지금까지 {dateCount}일간 {totalActivities}개 활동 · 총 {totalMinutes}분</div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">

          {/* 오각형 레이더 + 균형 점수 */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2">발달 영역 균형</h4>
            <div className="flex justify-center mb-3">
              <PentagonRadar values={radarValues} />
            </div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className={`text-lg font-bold ${scoreColorClass}`}>{balanceInfo.score}</span>
              <span className="text-xs text-gray-400">/ 100</span>
            </div>
            <p className="text-xs text-center text-gray-500">{balanceInfo.comment}</p>
          </div>

          {/* AI 월간 코멘트 */}
          {!isCustomRange && (
            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3">
              {aiLoading ? (
                <div className="text-center py-2">
                  <span className="text-xs text-violet-400 animate-pulse">전문가 코멘트를 만들고 있어요...</span>
                </div>
              ) : aiComment ? (
                <div>
                  <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-1">💬 이번 달 발달 코멘트</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{aiComment}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-400">데이터가 더 쌓이면 전문가 코멘트가 나타나요</p>
              )}
            </div>
          )}

          {/* 크로스 도메인 추천 */}
          <CrossDomainSuggestions weakest={balanceInfo.weakest} catCounts={catCounts} />

          {/* 주간 트렌드 */}
          <WeeklyTrendBars logs={logs} />

          {/* 선호/비선호 TOP3 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-1.5">😊 좋아한 활동</h4>
              {liked.length === 0 ? (
                <p className="text-xs text-gray-300">아직 없어요</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {liked.map((item, i) => {
                    const log = meaningful.find(l => l.activity_name === item.name)
                    const cat = (log?.category as ActivityCategory) ?? 'other'
                    return (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <span className="text-violet-400 font-bold">{i + 1}</span>
                        {cat !== 'other' && <span style={{ backgroundColor: CATEGORY_HEX[cat] }} className="w-1.5 h-3 rounded-full shrink-0" />}
                        <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                        <span className="text-gray-400">×{item.count}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-1.5">😟 싫어한 활동</h4>
              {disliked.length === 0 ? (
                <p className="text-xs text-gray-300">아직 없어요</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {disliked.map((item, i) => {
                    const log = meaningful.find(l => l.activity_name === item.name)
                    const cat = (log?.category as ActivityCategory) ?? 'other'
                    return (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <span className="text-orange-400 font-bold">{i + 1}</span>
                        {cat !== 'other' && <span style={{ backgroundColor: CATEGORY_HEX[cat] }} className="w-1.5 h-3 rounded-full shrink-0" />}
                        <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                        <span className="text-gray-400">×{item.count}</span>
                      </div>
                    )
                  })}
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
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{dateCount}일</div>
              <div className="text-[10px] text-gray-400">활동한 날</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{avgMinutesPerDay}분</div>
              <div className="text-[10px] text-gray-400">일 평균</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
