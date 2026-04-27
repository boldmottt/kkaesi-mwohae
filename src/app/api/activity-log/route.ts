import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { ActivityLog } from '@/lib/supabase/types'

export async function GET(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(req.url)
  const profileId = searchParams.get('profileId')
  const date = searchParams.get('date')
  const windowIndex = searchParams.get('windowIndex')

  if (!profileId || !date || windowIndex === null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { supabase } = auth
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('profile_id', profileId)
    .eq('log_date', date)
    .eq('window_index', parseInt(windowIndex))

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ logs: data as ActivityLog[] })
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  try {
    const { profileId, date, windowIndex, activityName, activityDuration, activityEffect, did, custom } =
      await req.json()

    if (!profileId || !date || windowIndex === undefined || !activityName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { supabase } = auth
    const { data, error } = await supabase
      .from('activity_log')
      .upsert(
        {
          profile_id: profileId,
          log_date: date,
          window_index: windowIndex,
          activity_name: activityName,
          activity_duration: activityDuration ?? null,
          activity_effect: activityEffect ?? null,
          did: did ?? false,
          custom: custom ?? false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'profile_id,log_date,window_index,activity_name' }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ log: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
