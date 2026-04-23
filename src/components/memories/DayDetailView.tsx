'use client'
import { useMemo } from 'react'
import { ActivityLog, ActivityCategory } from '@/lib/supabase/types'

interface Props {
  date: string
  logs: ActivityLog[]
  onClose: () => void
}

const DAY_LABELS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  physical: 'bg-orange-400',
  sensory: 'bg-purple-400',
  language: 'bg-blue-400',
  cognitive: 'bg-green-400',
  emotional: 'bg-pink-400',
  other: 'bg-gray-300',
}

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  physical: '신체',
  sensory: '감각',
  language: '언어',
  cognitive: '인지',
  emotional: '정서',
  other: '기타',
}

function formatDateHeader(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return `${m}월 ${d}일 ${DAY_LABELS[dt.getDay()]}`
}

function RatingIcon({ rating }: { rating: number }) {
  if (rating === 1) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <circle cx="12" cy="12" r="10" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1.5" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="white" strokeWidth="1.5" fill="none" />
        <circle cx="9" cy="9.5" r="1" fill="white" />
        <circle cx="15" cy="9.5" r="1" fill="white" />
      </svg>
    )
  }
  if (rating === -1) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <circle cx="12" cy="12" r="10" fill="#6b7280" stroke="#6b7280" strokeWidth="1.5" />
        <path d="M8 16s1.5-2 4-2 4 2 4 2" stroke="white" strokeWidth="1.5" fill="none" />
        <circle cx="9" cy="9.5" r="1" fill="white" />
        <circle cx="15" cy="9.5" r="1" fill="white" />
      </svg>
    )
  }
  return null
}

export function DayDetailView({ date, logs, onClose }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<number, ActivityLog[]>()
    for (const log of logs) {
      const list = map.get(log.window_index) ?? []
      list.push(log)
      map.set(log.window_index, list)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b)
  }, [logs])

  const categorySummary = useMemo(() => {
    const counts: Partial<Record<ActivityCategory, number>> = {}
    for (const log of logs) {
      const cat = log.category ?? 'other'
      counts[cat] = (counts[cat] ?? 0) + 1
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([cat, count]) => ({ category: cat as ActivityCategory, count: count as number }))
  }, [logs])

  const totalActivities = logs.length
  const likedCount = logs.filter(l => l.rating === 1).length
  const dislikedCount = logs.filter(l => l.rating === -1).length
  const notesCount = logs.filter(l => l.note && l.note.trim().length > 0).length

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-gray-800">{formatDateHeader(date)}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            활동 {totalActivities}개
            {likedCount > 0 && ` · 😊 ${likedCount}`}
            {dislikedCount > 0 && ` · 😟 ${dislikedCount}`}
            {notesCount > 0 && ` · 메모 ${notesCount}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
        >
          닫기
        </button>
      </div>

      {categorySummary.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {categorySummary.map(({ category, count }) => (
            <span
              key={category}
              className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 rounded-full px-2.5 py-1"
            >
              <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[category]}`} />
              {CATEGORY_LABELS[category]} {count}
            </span>
          ))}
        </div>
      )}

      {grouped.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center">
          <p className="text-gray-400 text-sm">이 날은 기록된 활동이 없어요.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(([windowIndex, windowLogs]) => (
            <section key={windowIndex} className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="text-amber-500 font-bold text-sm mb-3">
                깨시{windowIndex + 1}
              </h3>
              <div className="flex flex-col gap-2.5">
                {windowLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2">
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        CATEGORY_COLORS[(log.category as ActivityCategory) ?? 'other']
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium text-sm ${
                          log.did ? 'text-gray-700' : 'text-gray-400'
                        }`}>
                          {log.activity_name}
                        </span>
                        {log.activity_duration && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                            {log.activity_duration}
                          </span>
                        )}
                        <RatingIcon rating={log.rating} />
                        {log.is_custom && (
                          <span className="text-xs text-amber-400">✋</span>
                        )}
                      </div>
                      {log.note && log.note.trim() && (
                        <p className="text-xs text-gray-500 mt-1 bg-amber-50/50 rounded-lg px-2.5 py-1.5 whitespace-pre-wrap">
                          {log.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
