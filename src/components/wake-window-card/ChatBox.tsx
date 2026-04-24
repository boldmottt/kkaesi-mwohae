'use client'
import { useState, useEffect, useRef } from 'react'
import { Activity, ChatMessage } from '@/lib/supabase/types'

interface Props {
  windowIndex: number
  ageMonths: number
  durationMinutes: number
  currentActivities: Activity[]
  onActivitiesUpdate: (activities: Activity[]) => void
  profileId: string
  date: string
}

export function ChatBox({
  windowIndex,
  ageMonths,
  durationMinutes,
  currentActivities,
  onActivitiesUpdate,
  profileId,
  date,
}: Props) {
  const storageKey = `chat_${profileId}_${date}_w${windowIndex}`

  const [input, setInput] = useState('')
  const [history, setHistory] = useState<ChatMessage[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? (JSON.parse(stored) as ChatMessage[]) : []
    } catch {
      return []
    }
  })
  const [loading, setLoading] = useState(false)
  const historyRef = useRef<HTMLDivElement>(null)

  // localStorage 동기화
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(storageKey, JSON.stringify(history.slice(-20)))
    } catch {}
  }, [history, storageKey])

  // 히스토리 변경 시 스크롤 하단 고정
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight
    }
  }, [history])

  async function handleSend() {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    const newHistory: ChatMessage[] = [...history, { role: 'user', content: userMessage }]
    setHistory(newHistory)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ageMonths,
          windowIndex,
          durationMinutes,
          currentActivities,
          history,
          userMessage,
        }),
      })

      const data = await res.json()

      setHistory([...newHistory, { role: 'assistant', content: data.content }])

      if (data.type === 'update' && data.activities) {
        onActivitiesUpdate(data.activities)
      }
    } catch {
      setHistory([
        ...newHistory,
        { role: 'assistant', content: '죄송해요, 잠시 후 다시 시도해 주세요.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-5 border-t border-gray-100 pt-4">
      {history.length > 0 && (
        <div ref={historyRef} className="flex flex-col gap-2 mb-3 max-h-48 overflow-y-auto">
          {history.map((msg, i) => (
            <div
              key={i}
              className={`text-sm px-3 py-2 rounded-xl max-w-[85%] ${
                msg.role === 'user' ? 'bg-amber-100 self-end' : 'bg-gray-100 self-start'
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
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="궁금한 거 물어봐요"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-amber-400 text-white rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          전송
        </button>
      </div>
    </div>
  )
}
