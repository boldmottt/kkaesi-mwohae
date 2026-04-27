'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'magic' | 'password'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('magic')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    setLoading(false)
    setSent(true)
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('이메일 또는 비밀번호가 맞지 않아요.')
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold mb-4">깨시뭐해</h1>
        <p className="text-gray-600 text-center">
          {email}로 로그인 링크를 보냈어요.<br />
          메일함을 확인해 주세요.
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-2">깨시뭐해</h1>
      <p className="text-gray-500 mb-8 text-sm">아기의 깨어있는 시간, 뭐하면 좋을까?</p>

      <div className="flex w-full max-w-sm mb-4 rounded-xl overflow-hidden border border-gray-200">
        <button
          onClick={() => setMode('magic')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'magic' ? 'bg-brand-400 text-white' : 'bg-white text-gray-500'}`}
        >
          이메일 링크
        </button>
        <button
          onClick={() => setMode('password')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'password' ? 'bg-brand-400 text-white' : 'bg-white text-gray-500'}`}
        >
          비밀번호
        </button>
      </div>

      {mode === 'magic' ? (
        <form onSubmit={handleMagicLink} className="w-full max-w-sm flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="이메일 주소 입력"
            required
            className="border border-gray-300 rounded-xl px-4 py-3 text-base w-full"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-400 text-white rounded-xl px-4 py-3 text-base font-semibold disabled:opacity-60"
          >
            {loading ? '전송 중...' : '로그인 링크 받기'}
          </button>
        </form>
      ) : (
        <form onSubmit={handlePassword} className="w-full max-w-sm flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="이메일 주소"
            required
            className="border border-gray-300 rounded-xl px-4 py-3 text-base w-full"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="비밀번호"
            required
            className="border border-gray-300 rounded-xl px-4 py-3 text-base w-full"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-400 text-white rounded-xl px-4 py-3 text-base font-semibold disabled:opacity-60"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      )}
    </main>
  )
}
