import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(req: NextRequest) {
  try {
    const { profileId, date, windowIndex, activities } = await req.json()

    if (!profileId || !date || windowIndex === undefined || !activities) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('activity_cache')
      .update({ activities })
      .eq('profile_id', profileId)
      .eq('cache_date', date)
      .eq('window_index', windowIndex)

    if (error) {
      console.error('Cache update error:', error)
      return NextResponse.json({ error: 'Failed to update cache' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Cache update error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
