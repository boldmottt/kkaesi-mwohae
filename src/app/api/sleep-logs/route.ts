import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  try {
    const { searchParams } = new URL(req.url)
    const profileId = searchParams.get('profileId')
    const date = searchParams.get('date')

    if (!profileId || !date) {
      return NextResponse.json({ error: 'profileId and date required' }, { status: 400 })
    }

    const { supabase } = auth
    const { data, error } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('profile_id', profileId)
      .eq('log_date', date)
      .order('nap_index', { ascending: true })

    if (error) throw error
    return NextResponse.json({ sleepLogs: data ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Sleep logs GET error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  try {
    const { profileId, date, napIndex, sleepStart, sleepEnd } = await req.json()

    if (!profileId || !date || napIndex === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { supabase } = auth
    const { data, error } = await supabase
      .from('sleep_logs')
      .upsert(
        {
          profile_id: profileId,
          log_date: date,
          nap_index: napIndex,
          sleep_start: sleepStart ?? null,
          sleep_end: sleepEnd ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'profile_id,log_date,nap_index' }
      )
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ sleepLog: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Sleep logs POST error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
