import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateActivities } from '@/lib/claude/activities'

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

    const { data: cached } = await supabase
      .from('activity_cache')
      .select('activities, duration_minutes, routines')
      .eq('profile_id', profileId)
      .eq('cache_date', date)
      .eq('window_index', windowIndex)
      .single()

    const routinesStr = routines ?? null
    if (
      cached &&
      cached.duration_minutes === durationMinutes &&
      (cached.routines ?? null) === routinesStr
    ) {
      return NextResponse.json({ activities: cached.activities })
    }

    const activities = await generateActivities({
      ageDays,
      ageMonths,
      windowIndex,
      totalWindows,
      durationMinutes,
      startTime: startTime ?? null,
      routines: routinesStr,
      date,
    })

    await supabase.from('activity_cache').upsert({
      profile_id: profileId,
      cache_date: date,
      window_index: windowIndex,
      duration_minutes: durationMinutes,
      routines: routinesStr,
      activities,
    })

    return NextResponse.json({ activities })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Activities API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
