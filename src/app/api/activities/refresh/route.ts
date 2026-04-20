import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateActivities } from '@/lib/claude/activities'

function normalizeRoutines(val: unknown): string | null {
  if (typeof val === 'string' && val.trim().length > 0) return val.trim()
  return null
}

export async function POST(req: NextRequest) {
  try {
    const {
      profileId,
      windowIndex,
      totalWindows,
      durationMinutes,
      startTime,
      ageMonths,
      ageDays,
      date,
      routines,
    } = await req.json()

    if (
      !profileId ||
      windowIndex === undefined ||
      !totalWindows ||
      !durationMinutes ||
      ageMonths === undefined ||
      ageDays === undefined ||
      !date
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()
    const routinesNorm = normalizeRoutines(routines)

    await supabase
      .from('activity_cache')
      .delete()
      .eq('profile_id', profileId)
      .eq('cache_date', date)
      .eq('window_index', windowIndex)

    const activities = await generateActivities({
      ageDays,
      ageMonths,
      windowIndex,
      totalWindows,
      durationMinutes,
      startTime: startTime ?? null,
      routines: routinesNorm,
      date,
    })

    const { error: insertError } = await supabase
      .from('activity_cache')
      .insert({
        profile_id: profileId,
        cache_date: date,
        window_index: windowIndex,
        duration_minutes: durationMinutes,
        routines: routinesNorm,
        activities,
      })

    if (insertError) {
      console.error('Cache insert error after refresh:', insertError)
    }

    return NextResponse.json({ activities })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Activities refresh error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
