'use client'
import { useEffect, useState } from 'react'
import { Routine, RoutineKind, RoutineAnchor, RoutinePosition } from '@/lib/supabase/types'

interface Props {
  profileId: string
}

interface DraftRoutine {
  id?: string
  label: string
  description: string
  durationMinutes: number
  kind: RoutineKind
  startTime: string
  windowAnchor: RoutineAnchor
  position: RoutinePosition
  enabled: boolean
}

const EMPTY_DRAFT: DraftRoutine = {
  label: '',
  description: '',
  durationMinutes: 30,
  kind: 'window_position',
  startTime: '14:00',
  windowAnchor: 'last',
  position: 'end',
  enabled: true,
}

function summarize(r: Routine): string {
  if (r.kind === 'time_of_day') {
    const start = (r.start_time ?? '').slice(0, 5)
    return `매일 ${start}부터 ${r.duration_minutes}분`
  }
  const anchor = r.window_anchor === 'first' ? '첫' : '마지막'
  const side = r.position === 'start' ? '처음' : '마지막'
  return `${anchor} 깨시의 ${side} ${r.duration_minutes}분`
}

export function RoutineSettings({ profileId }: Props) {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<DraftRoutine | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profileId) return
    fetch(`/api/routines?profileId=${profileId}`)
      .then(r => r.json())
      .then(data => {
        setRoutines(data.routines ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [profileId])

  async function save() {
    if (!draft || !draft.label.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draft.id,
          profileId,
          label: draft.label.trim(),
          description: draft.description.trim() || null,
          durationMinutes: draft.durationMinutes,
          kind: draft.kind,
          startTime: draft.kind === 'time_of_day' ? draft.startTime : null,
          windowAnchor: draft.kind === 'window_position' ? draft.windowAnchor : null,
          position: draft.kind === 'window_position' ? draft.position : null,
          enabled: draft.enabled,
        }),
      })
      const data = await res.json()
      if (res.ok && data.routine) {
        setRoutines(prev => {
          const without = prev.filter(r => r.id !== data.routine.id)
          return [...without, data.routine].sort((a, b) =>
            a.created_at < b.created_at ? -1 : 1
          )
        })
        setDraft(null)
      }
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('이 루틴을 삭제할까요?')) return
    const res = await fetch(`/api/routines?id=${id}&profileId=${profileId}`, {
      method: 'DELETE',
    })
    if (res.ok) setRoutines(prev => prev.filter(r => r.id !== id))
  }

  async function toggleEnabled(r: Routine) {
    const res = await fetch('/api/routines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: r.id,
        profileId,
        label: r.label,
        description: r.description,
        durationMinutes: r.duration_minutes,
        kind: r.kind,
        startTime: r.start_time,
        windowAnchor: r.window_anchor,
        position: r.position,
        enabled: !r.enabled,
      }),
    })
    const data = await res.json()
    if (res.ok && data.routine) {
      setRoutines(prev => prev.map(x => (x.id === r.id ? data.routine : x)))
    }
  }

  function startEdit(r: Routine) {
    setDraft({
      id: r.id,
      label: r.label,
      description: r.description ?? '',
      durationMinutes: r.duration_minutes,
      kind: r.kind,
      startTime: (r.start_time ?? '14:00').slice(0, 5),
      windowAnchor: r.window_anchor ?? 'last',
      position: r.position ?? 'end',
      enabled: r.enabled,
    })
  }

  return (
    <div>
      {loading ? (
        <p className="text-sm text-gray-400">불러오는 중...</p>
      ) : routines.length === 0 && !draft ? (
        <p className="text-sm text-gray-400 mb-3">
          아직 등록된 루틴이 없어요. 추가해보세요.
        </p>
      ) : (
        <ul className="flex flex-col gap-2 mb-3">
          {routines.map(r => (
            <li
              key={r.id}
              className={`bg-white rounded-xl p-3 flex items-start gap-3 ${
                r.enabled ? '' : 'opacity-50'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleEnabled(r)}
                aria-label={r.enabled ? '끄기' : '켜기'}
                className={`mt-0.5 w-5 h-5 shrink-0 rounded-full border-2 transition ${
                  r.enabled
                    ? 'bg-amber-500 border-amber-500'
                    : 'border-gray-300'
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{r.label}</p>
                <p className="text-xs text-gray-400">{summarize(r)}</p>
                {r.description && (
                  <p className="text-xs text-gray-500 mt-1">{r.description}</p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(r)}
                  className="text-xs text-gray-400 hover:text-amber-500 px-2 py-1"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  className="text-xs text-gray-400 hover:text-red-400 px-2 py-1"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {draft ? (
        <div className="bg-white rounded-xl p-4 border border-amber-200">
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">이름</span>
              <input
                type="text"
                value={draft.label}
                onChange={e => setDraft({ ...draft, label: e.target.value })}
                placeholder="예: 수면 루틴, 산책"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">길이</span>
              <select
                value={draft.durationMinutes}
                onChange={e =>
                  setDraft({ ...draft, durationMinutes: parseInt(e.target.value, 10) })
                }
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                {[10, 15, 20, 30, 40, 45, 60, 75, 90, 120].map(m => (
                  <option key={m} value={m}>
                    {m}분
                  </option>
                ))}
              </select>
            </label>

            <div>
              <p className="text-xs text-gray-500 mb-1">종류</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, kind: 'window_position' })}
                  className={`flex-1 py-2 rounded-lg text-sm ${
                    draft.kind === 'window_position'
                      ? 'bg-amber-100 text-amber-600 font-semibold'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  깨시 기준
                </button>
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, kind: 'time_of_day' })}
                  className={`flex-1 py-2 rounded-lg text-sm ${
                    draft.kind === 'time_of_day'
                      ? 'bg-amber-100 text-amber-600 font-semibold'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  시간대
                </button>
              </div>
            </div>

            {draft.kind === 'window_position' ? (
              <div className="flex flex-col gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">어떤 깨시</span>
                  <select
                    value={draft.windowAnchor}
                    onChange={e =>
                      setDraft({
                        ...draft,
                        windowAnchor: e.target.value as RoutineAnchor,
                      })
                    }
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="first">첫 깨시</option>
                    <option value="last">마지막 깨시</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">위치</span>
                  <select
                    value={draft.position}
                    onChange={e =>
                      setDraft({
                        ...draft,
                        position: e.target.value as RoutinePosition,
                      })
                    }
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="start">처음</option>
                    <option value="end">마지막</option>
                  </select>
                </label>
              </div>
            ) : (
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">시작 시각</span>
                <input
                  type="time"
                  value={draft.startTime}
                  onChange={e => setDraft({ ...draft, startTime: e.target.value })}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </label>
            )}

            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">설명 (선택)</span>
              <textarea
                value={draft.description}
                onChange={e => setDraft({ ...draft, description: e.target.value })}
                placeholder="차분한 조명, 자장가, 마사지 등"
                rows={2}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-amber-400"
              />
            </label>

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2 text-sm"
              >
                취소
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving || !draft.label.trim()}
                className="flex-1 bg-amber-400 text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-60"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setDraft(EMPTY_DRAFT)}
          className="w-full border border-dashed border-amber-300 text-amber-500 rounded-xl py-3 text-sm font-semibold"
        >
          + 루틴 추가
        </button>
      )}
    </div>
  )
}
