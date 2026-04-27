import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export interface AuthenticatedContext {
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never
  userId: string
}

/**
 * API 라우트에서 인증을 확인하고 authenticated context를 반환.
 * 미인증 시 401 JSON 응답 반환.
 * 
 * 사용법:
 *   const auth = await requireAuth()
 *   if (!auth.ok) return auth.response
 *   const { supabase, userId } = auth
 */
export async function requireAuth(): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { ok: true, supabase, userId: user.id }
}
