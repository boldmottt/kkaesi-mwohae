import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { profileId } = await req.json()

    if (!profileId) {
      return NextResponse.json({ error: 'Missing profileId' }, { status: 400 })
    }

    const supabase = await createClient()
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
