import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function todayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function clearFutureCache(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string
) {
  await supabase
    .from('activity_cache')
    .delete()
    .eq('profile_id', profileId)
    .gte('cache_date', todayString())
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const profileId = searchParams.get('profileId')
    if (!profileId) {
      return NextResponse.json({ error: 'profileId required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json({ routines: data ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
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
      id,
      profileId,
      label,
      description,
      durationMinutes,
      kind,
      startTime,
      windowAnchor,
      position,
      enabled,
    } = body

    if (!profileId || !label || !durationMinutes || !kind) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (kind === 'time_of_day' && !startTime) {
      return NextResponse.json({ error: 'startTime required for time_of_day' }, { status: 400 })
    }
    if (kind === 'window_position' && (!windowAnchor || !position)) {
      return NextResponse.json({ error: 'windowAnchor and position required' }, { status: 400 })
    }

    const row = {
      profile_id: profileId,
      label,
      description: description ?? null,
      duration_minutes: durationMinutes,
      kind,
      start_time: kind === 'time_of_day' ? startTime : null,
      window_anchor: kind === 'window_position' ? windowAnchor : null,
      position: kind === 'window_position' ? position : null,
      enabled: enabled ?? true,
      updated_at: new Date().toISOString(),
    }

    const query = id
      ? supabase.from('routines').update(row).eq('id', id).select().single()
      : supabase.from('routines').insert(row).select().single()

    const { data, error } = await query
    if (error) throw error

    await clearFutureCache(supabase, profileId)
    return NextResponse.json({ routine: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const profileId = searchParams.get('profileId')
    if (!id || !profileId) {
      return NextResponse.json({ error: 'id and profileId required' }, { status: 400 })
    }

    const { error } = await supabase.from('routines').delete().eq('id', id)
    if (error) throw error

    await clearFutureCache(supabase, profileId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
