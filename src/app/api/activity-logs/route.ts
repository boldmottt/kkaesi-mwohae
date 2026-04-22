import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await supabase.from('activity_logs').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Activity logs DELETE error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const profileId = searchParams.get('profileId')
    const date = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') ?? '500', 10)

    if (!profileId) {
      return NextResponse.json({ error: 'profileId required' }, { status: 400 })
    }

    let query = supabase
      .from('activity_logs')
      .select('*')
      .eq('profile_id', profileId)
      .order('log_date', { ascending: false })
      .order('window_index', { ascending: true })
      .limit(limit)

    if (date) {
      query = query.eq('log_date', date)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ logs: data ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Activity logs GET error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      profileId,
      logDate,
      windowIndex,
      activityName,
      activityDuration,
      activityEffect,
      did,
      rating,
      note,
      isCustom,
      category,
    } = body

    if (!profileId || !logDate || windowIndex === undefined || !activityName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('activity_logs')
      .upsert(
        {
          profile_id: profileId,
          log_date: logDate,
          window_index: windowIndex,
          activity_name: activityName,
          activity_duration: activityDuration ?? null,
          activity_effect: activityEffect ?? null,
          did: did ?? false,
          rating: rating ?? 0,
          note: note ?? null,
          is_custom: isCustom ?? false,
          category: (category as string) ?? 'other',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'profile_id,log_date,window_index,activity_name' }
      )
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ log: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Activity logs POST error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
