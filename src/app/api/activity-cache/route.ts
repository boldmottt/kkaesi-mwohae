import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const profileId = searchParams.get('profileId')

    if (!profileId) {
      return NextResponse.json({ error: 'profileId required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('activity_cache')
      .delete()
      .eq('profile_id', profileId)

    if (error) throw error

    return NextResponse.json({ ok: true, message: '캐시가 초기화됐어요' })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
