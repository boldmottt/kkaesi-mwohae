'use client'
import { useState, useEffect, useRef } from 'react'
import { Activity, ChatMessage, WakeWindow } from '@/lib/supabase/types'

interface RoutineStatus {
  windowIndex: number
  routineText: string
  skipped: boolean
}

interface Props {
  profileId: string
  ageMonths: number
  ageDays: number
  date: string
  wakeWindows: WakeWindow[]
  currentActivitiesByWindow: Record<number, Activity[]>
  onScheduleUpdate: (windowIndex: number, activities: Activity[]) => void
}

export function DailyChat({
  profileId,
  ageMonths,
  ageDays,
  date,
  wakeWindows,
  currentActivitiesByWindow,
  onScheduleUpdate,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [routineStatuses, setRoutineStatuses] = useState<RoutineStatus[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [scheduleApplied, setScheduleApplied] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadPreviousChat() {
      try {
        const res = await fetch(`/api/daily-chat?profileId=${profileId}&date=${date}`)
        const data = await res.json()
        if (data.session?.messages?.length > 0) {
          setMessages(data.session.messages)
          setScheduleApplied(data.session.schedule_applied)
          setInitialized(true)
        }
        if (data.routineStatuses?.length > 0) {
          setRoutineStatuses(data.routineStatuses.map((rs: { window_index: number; routine_text: string; skipped: boolean }) => ({
            windowIndex: rs.window_index,
            routineText: rs.routine_text,
            skipped: rs.skipped,
          })))
        }
      } catch {
        console.error('Failed to load previous chat')
      }
    }
    loadPreviousChat()
  }, [profileId, date])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function startConversation() {
    setIsOpen(true)
    if (initialized) return

    setLoading(true)
    try {
      const windowsData = wakeWindows.map((ww, i) => ({
        windowIndex: i,
        durationMinutes: ww.duration_minutes,
        startTime: ww.start_time,
        routines: ww.routines,
        currentActivities: currentActivitiesByWindow[i] ?? [],
      }))

      const res = await fetch('/api/daily-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          ageMonths,
          ageDays,
          date,
          wakeWindows: windowsData,
          routineStatuses,
          history: [],
          userMessage: '오늘 하루 스케줄을 설계해줘',
        }),
      })
      const data = await res.json()
      setMessages([
        { role: 'user', content: '오늘 하루 스케줄을 설계해줘' },
        { role: 'assistant', content: data.content },
      ])
      setInitialized(true)
    } catch {
      setMessages([{ role: 'assistant', content: '대화를 시작할 수 없어요. 다시 시도해주세요.' }])
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)

    try {
      const windowsData = wakeWindows.map((ww, i) => ({
        windowIndex: i,
        durationMinutes: ww.duration_minutes,
        startTime: ww.start_time,
        routines: ww.routines,
        currentActivities: currentActivitiesByWindow[i] ?? [],
      }))

      const res = await fetch('/api/daily-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          ageMonths,
          ageDays,
          date,
          wakeWindows: windowsData,
          routineStatuses,
          history: messages,
          userMessage,
        }),
      })

      const data = await res.json()
      setMessages([...newMessages, { role: 'assistant', content: data.content }])

      if (data.type === 'schedule_update' && data.updatedWindows) {
        for (const uw of data.updatedWindows) {
          onScheduleUpdate(uw.windowIndex, uw.activities)
        }
        setScheduleApplied(true)
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: '죄송해요, 잠시 후 다시 시도해 주세요.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function handleRoutineToggle(windowIndex: number, routineText: string, skipped: boolean) {
    const updated = routineStatuses.filter(r => r.windowIndex !== windowIndex)
    updated.push({ windowIndex, routineText, skipped })
    setRoutineStatuses(updated)

    try {
      await fetch('/api/daily-chat/routine-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, date, windowIndex, routineText, skipped }),
      })
    } catch {
      console.error('Failed to save routine status')
    }
  }

  const windowsWithRoutines = wakeWindows
    .map((ww, i) => ({ index: i, routines: ww.routines }))
    .filter(w => w.routines)

  return (
    <div className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
      <button
        onClick={() => isOpen ? setIsOpen(false) : startConversation()}
        className="w-full px-5 py-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <span className="font-semibold text-sm">오늘 하루 설계하기</span>
          {scheduleApplied && (
            <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">반영됨</span>
          )}
        </div>
        <span className="text-gray-400 text-sm">{isOpen ? '접기' : '펼치기'}</span>
      </button>

      {isOpen && (
        <div className="px-5 pb-5">
          {windowsWithRoutines.length > 0 && (
            <div className="mb-4 p-3 bg-brand-50 rounded-xl">
              <p className="text-xs font-semibold text-brand-700 mb-2">📌 오늘의 루틴</p>
              {windowsWithRoutines.map(w => {
                const status = routineStatuses.find(r => r.windowIndex === w.index)
                const isSkipped = status?.skipped ?? false
                return (
                  <div key={w.index} className="flex items-center justify-between py-1.5">
                    <span className={`text-xs ${isSkipped ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      깨시{w.index + 1}: {w.routines}
                    </span>
                    <button
                      onClick={() => handleRoutineToggle(w.index, w.routines!, !isSkipped)}
                      className={`text-xs px-2 py-1 rounded-lg ${isSkipped ? 'bg-gray-200 text-gray-500' : 'bg-brand-200 text-brand-700'}`}
                    >
                      {isSkipped ? '스킵됨' : '유지'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex flex-col gap-2 mb-3 max-h-64 overflow-y-auto">
            {messages.filter(m => m.content !== '오늘 하루 스케줄을 설계해줘').map((msg, i) => (
              <div
                key={i}
                className={`text-sm px-3 py-2 rounded-xl max-w-[85%] ${
                  msg.role === 'user' ? 'bg-brand-100 self-end' : 'bg-gray-100 self-start'
                }`}
              >
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="bg-gray-100 text-sm px-3 py-2 rounded-xl self-start animate-pulse">
                생각 중...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="오늘 일정이나 컨디션을 알려주세요"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-brand-400 text-white rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              전송
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
