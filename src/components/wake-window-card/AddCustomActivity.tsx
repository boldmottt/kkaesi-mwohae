'use client'
import { useState, useEffect } from 'react'
import { CustomActivityTag } from '@/lib/supabase/types'

interface Props {
  profileId: string
  date: string
  windowIndex: number
  onSaved: () => void
}

type Step = 'closed' | 'select_tag' | 'set_duration'

export function AddCustomActivity({ profileId, date, windowIndex, onSaved }: Props) {
  const [step, setStep] = useState<Step>('closed')
  const [tags, setTags] = useState<CustomActivityTag[]>([])
  const [selectedLabel, setSelectedLabel] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [minutes, setMinutes] = useState(0)
  const [newTagInput, setNewTagInput] = useState('')
  const [showNewTagInput, setShowNewTagInput] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (step !== 'select_tag') return
    async function loadTags() {
      try {
        const res = await fetch(`/api/custom-tags?profileId=${profileId}`)
        const data = await res.json()
        if (data.tags) setTags(data.tags)
      } catch {
        // 실패해도 빈 목록으로 진행
      }
    }
    loadTags()
  }, [step, profileId])

  function handleOpen() {
    setStep('select_tag')
    setSelectedLabel('')
    setSelectedCategory(null)
    setMinutes(0)
    setShowNewTagInput(false)
    setNewTagInput('')
  }

  function handleClose() {
    setStep('closed')
    setSelectedLabel('')
    setSelectedCategory(null)
    setMinutes(0)
    setShowNewTagInput(false)
    setNewTagInput('')
  }

  function handleSelectTag(tag: CustomActivityTag) {
    setSelectedLabel(tag.label)
    setSelectedCategory(tag.category ?? null)
    setMinutes(0)
    setStep('set_duration')
  }

  function handleCreateNewTag() {
    const trimmed = newTagInput.trim()
    if (!trimmed) return
    setSelectedLabel(trimmed)
    setSelectedCategory(null) // AI가 분류할 예정
    setMinutes(0)
    setShowNewTagInput(false)
    setNewTagInput('')
    setStep('set_duration')
  }

  async function classifyActivity(activityName: string): Promise<string> {
    try {
      const res = await fetch('/api/classify-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityName }),
      })
      const data = await res.json()
      return data.category ?? 'other'
    } catch {
      return 'other'
    }
  }

  async function handleSave() {
    if (!selectedLabel || minutes <= 0) return
    setSaving(true)
    try {
      // 카테고리가 없으면 AI에게 분류 요청
      let category = selectedCategory
      if (!category || category === 'other') {
        category = await classifyActivity(selectedLabel)
      }

      // 태그 저장 (카테고리 포함)
      await fetch('/api/custom-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, label: selectedLabel, category }),
      })

      // activity_logs에 저장
      await fetch('/api/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          logDate: date,
          windowIndex,
          activityName: selectedLabel,
          activityDuration: `${minutes}분`,
          activityEffect: '직접 추가한 활동',
          did: true,
          rating: 0,
          note: null,
          isCustom: true,
          category,
        }),
      })

      onSaved()
      handleClose()
    } catch {
      // 에러 시 조용히 실패
    } finally {
      setSaving(false)
    }
  }

  if (step === 'closed') {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="mt-3 w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-colors"
      >
        + 다른 활동
      </button>
    )
  }

  if (step === 'select_tag') {
    return (
      <div className="mt-3 border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">어떤 활동을 했나요?</span>
          <button
            type="button"
            onClick={handleClose}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            취소
          </button>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleSelectTag(tag)}
                className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full text-sm hover:bg-brand-100 transition-colors"
              >
                {tag.label}
              </button>
            ))}
          </div>
        )}

        {showNewTagInput ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagInput}
              onChange={e => setNewTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateNewTag()}
              placeholder="활동 이름 입력"
              autoFocus
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-300"
            />
            <button
              type="button"
              onClick={handleCreateNewTag}
              disabled={!newTagInput.trim()}
              className="px-3 py-1.5 bg-brand-400 text-white rounded-lg text-sm font-semibold disabled:opacity-40"
            >
              확인
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNewTagInput(true)}
            className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-colors"
          >
            + 새 태그 만들기
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="mt-3 border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700">{selectedLabel}</span>
        <button
          type="button"
          onClick={() => setStep('select_tag')}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          ← 다른 활동
        </button>
      </div>

      <div className="text-center mb-4">
        <span className="text-3xl font-bold text-brand-500">{minutes}</span>
        <span className="text-lg text-gray-400 ml-1">분</span>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setMinutes(prev => prev + 1)}
          className="flex-1 py-2.5 bg-gray-100 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition-colors"
        >
          +1분
        </button>
        <button
          type="button"
          onClick={() => setMinutes(prev => prev + 5)}
          className="flex-1 py-2.5 bg-gray-100 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition-colors"
        >
          +5분
        </button>
        <button
          type="button"
          onClick={() => setMinutes(prev => prev + 30)}
          className="flex-1 py-2.5 bg-gray-100 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition-colors"
        >
          +30분
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMinutes(0)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          초기화
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || minutes <= 0}
          className="flex-1 py-2.5 bg-brand-400 text-white rounded-lg text-sm font-semibold disabled:opacity-40 transition-colors"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}
