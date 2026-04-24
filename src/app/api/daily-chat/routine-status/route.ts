import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { profileId, date, windowIndex, routineText, skipped } = await req.json()

    if (!profileId || !date || windowIndex === undefined || !routineText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { error } = await supabase
      .from('daily_routine_status')
      .upsert(
        {
          profile_id: profileId,
          status_date: date,
          window_index: windowIndex,
          routine_text: routineText,
          skipped,
        },
        { onConflict: 'profile_id,status_date,window_index' }
      )

    if (error) {
      console.error('Routine status upsert error:', error)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Routine status error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
