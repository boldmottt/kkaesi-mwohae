'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function JoinContent() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }

    const supabase = createClient()

    async function acceptInvite() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/login?next=/join?token=${token}`)
        return
      }

      const { data: invite } = await supabase
        .from('invitations')
        .select('profile_id, accepted_at')
        .eq('token', token)
        .single()

      if (!invite || invite.accepted_at) {
        setStatus('error')
        return
      }

      const { error: memberError } = await supabase
        .from('profile_members')
        .upsert({ profile_id: invite.profile_id, user_id: user.id })

      if (memberError) {
        setStatus('error')
        return
      }

      await supabase
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('token', token)

      setStatus('success')
      setTimeout(() => router.push('/'), 1500)
    }

    acceptInvite()
  }, [token, router])

  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-gray-500">초대 수락 중...</p>
      </main>
    )
  }

  if (status === 'success') {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="font-semibold">완료!</p>
          <p className="text-gray-500 text-sm mt-1">홈으로 이동 중...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-2xl mb-2">❌</p>
        <p className="font-semibold">유효하지 않은 초대 링크입니다</p>
        <p className="text-gray-500 text-sm mt-1">이미 사용됐거나 만료된 링크예요.</p>
      </div>
    </main>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">로딩 중...</p>
      </main>
    }>
      <JoinContent />
    </Suspense>
  )
}
