'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    setSent(true)
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
      <form onSubmit={handleLogin} className="w-full max-w-sm flex flex-col gap-4">
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
          className="bg-amber-400 text-white rounded-xl px-4 py-3 text-base font-semibold"
        >
          로그인 링크 받기
        </button>
      </form>
    </main>
  )
}
