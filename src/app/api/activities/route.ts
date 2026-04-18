import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateActivities } from '@/lib/claude/activities'

export async function POST(req: NextRequest) {
  try {
    const { profileId, windowIndex, durationMinutes, ageMonths, date } = await req.json()

    if (!profileId || windowIndex === undefined || !durationMinutes || ageMonths === undefined || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check cache first
    const { data: cached } = await supabase
      .from('activity_cache')
      .select('activities')
      .eq('profile_id', profileId)
      .eq('cache_date', date)
      .eq('window_index', windowIndex)
      .single()

    if (cached) {
      return NextResponse.json({ activities: cached.activities })
    }

    // Generate via Claude API
    const activities = await generateActivities({ ageMonths, windowIndex, durationMinutes, date })

    // Save to cache
    await supabase.from('activity_cache').upsert({
      profile_id: profileId,
      cache_date: date,
      window_index: windowIndex,
      activities,
    })

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Activities API error:', error)
    return NextResponse.json({ error: 'Failed to generate activities' }, { status: 500 })
  }
}
