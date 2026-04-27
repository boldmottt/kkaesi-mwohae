'use client'
import { useState, useRef } from 'react'

interface Props {
  onSuggestion: (avgCount: number) => void
}

export function BabyTimeImport({ onSuggestion }: Props) {
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/import', { method: 'POST', body: formData })
      const data = await res.json()
      setResult(data.suggestion)
      if (data.avgWakeWindowCount > 0) {
        onSuggestion(data.avgWakeWindowCount)
      }
    } catch {
      setResult('파일을 읽는 중 오류가 발생했어요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl p-4">
      <p className="text-sm text-gray-600 mb-3">
        BabyTime CSV 파일을 가져오면 깨시 설정을 자동으로 제안해 드려요.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.txt"
        onChange={handleFile}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="border border-gray-300 rounded-xl px-4 py-2 text-sm w-full disabled:opacity-50"
      >
        {loading ? '분석 중...' : '파일 선택 (CSV / TXT)'}
      </button>
      {result && (
        <p className="text-sm text-brand-600 mt-2">{result}</p>
      )}
    </div>
  )
}
