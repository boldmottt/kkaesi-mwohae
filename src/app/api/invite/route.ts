import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  try {
    const { profileId } = await req.json()

    if (!profileId) {
      return NextResponse.json({ error: 'Missing profileId' }, { status: 400 })
    }

    const { supabase } = auth
    const token = randomUUID()

    const { error } = await supabase
      .from('invitations')
      .insert({ profile_id: profileId, token })

    if (error) {
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    const inviteUrl = `${req.nextUrl.origin}/join?token=${token}`
    return NextResponse.json({ inviteUrl })
  } catch (error) {
    console.error('Invite API error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
