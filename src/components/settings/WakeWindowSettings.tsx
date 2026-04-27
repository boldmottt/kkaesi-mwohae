'use client'
import { formatDuration } from '@/lib/utils/time'

export interface WakeWindowDraft {
  duration_minutes: number
  start_time: string
  routines: string
}

interface Props {
  value: WakeWindowDraft[]
  onChange: (windows: WakeWindowDraft[]) => void
}

export function WakeWindowSettings({ value, onChange }: Props) {
  function addWindow() {
    onChange([...value, { duration_minutes: 60, start_time: '', routines: '' }])
  }

  function removeWindow() {
    if (value.length <= 1) return
    onChange(value.slice(0, -1))
  }

  function updateDuration(index: number, minutes: number) {
    onChange(value.map((w, i) => i === index ? { ...w, duration_minutes: minutes } : w))
  }

  function updateStartTime(index: number, time: string) {
    onChange(value.map((w, i) => i === index ? { ...w, start_time: time } : w))
  }

  function updateRoutines(index: number, routines: string) {
    onChange(value.map((w, i) => i === index ? { ...w, routines } : w))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="font-semibold">깨시 횟수</span>
        <button
          type="button"
          onClick={removeWindow}
          disabled={value.length <= 1}
          className="w-8 h-8 rounded-full bg-gray-200 text-lg font-bold disabled:opacity-40"
        >
          −
        </button>
        <span className="text-lg font-bold">{value.length}회</span>
        <button
          type="button"
          onClick={addWindow}
          className="w-8 h-8 rounded-full bg-brand-400 text-white text-lg font-bold"
        >
          +
        </button>
      </div>

      {value.map((window, index) => (
        <div key={index} className="bg-white rounded-xl p-4 flex flex-col gap-3">
          <span className="font-semibold text-brand-600">깨시{index + 1}</span>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">깨어있는 시간</label>
            <select
              value={window.duration_minutes}
              onChange={e => updateDuration(index, Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full"
            >
              {Array.from({ length: 24 }, (_, i) => (i + 1) * 10).map(m => (
                <option key={m} value={m}>{formatDuration(m)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">
              대략적인 시작 시간 <span className="text-gray-400">(선택)</span>
            </label>
            <input
              type="time"
              value={window.start_time}
              onChange={e => updateStartTime(index, e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">
              고정 루틴 <span className="text-gray-400">(선택)</span>
            </label>
            <textarea
              value={window.routines}
              onChange={e => updateRoutines(index, e.target.value)}
              placeholder="예: 마지막 1시간은 목욕→마사지→수유→자장가 수면 루틴 / 오후 1시에 산책 30분"
              rows={2}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm resize-none"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
