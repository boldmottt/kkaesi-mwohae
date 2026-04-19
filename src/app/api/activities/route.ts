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

    // Cache lookup — includes duration so changing duration invalidates cache
    const { data: cached } = await supabase
      .from('activity_cache')
      .select('activities, duration_minutes')
      .eq('profile_id', profileId)
      .eq('cache_date', date)
      .eq('window_index', windowIndex)
      .single()

    if (cached && cached.duration_minutes === durationMinutes) {
      return NextResponse.json({ activities: cached.activities })
    }

    const activities = await generateActivities({
      ageDays,
      ageMonths,
      windowIndex,
      totalWindows,
      durationMinutes,
      startTime: startTime ?? null,
      date,
    })

    await supabase.from('activity_cache').upsert({
      profile_id: profileId,
      cache_date: date,
      window_index: windowIndex,
      duration_minutes: durationMinutes,
      activities,
    })

    return NextResponse.json({ activities })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Activities API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
