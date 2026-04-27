import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateActivities } from '@/lib/claude/activities'
import { requireAuth } from '@/lib/auth-middleware'

function normalizeRoutines(val: unknown): string | null {
  if (typeof val === 'string' && val.trim().length > 0) return val.trim()
  return null
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

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

    const { supabase } = auth
    const routinesNorm = normalizeRoutines(routines)

    // 루틴 스킵 상태 확인
    const { data: routineStatus } = await supabase
      .from('daily_routine_status')
      .select('skipped')
      .eq('profile_id', profileId)
      .eq('status_date', date)
      .eq('window_index', windowIndex)
      .maybeSingle()

    const effectiveRoutines = routineStatus?.skipped ? null : routinesNorm

    const { data: cached } = await supabase
      .from('activity_cache')
      .select('activities, duration_minutes, routines')
      .eq('profile_id', profileId)
      .eq('cache_date', date)
      .eq('window_index', windowIndex)
      .maybeSingle()

    const cachedRoutinesNorm = normalizeRoutines(cached?.routines)
    if (
      cached &&
      cached.activities &&
      cached.duration_minutes === durationMinutes &&
      cachedRoutinesNorm === effectiveRoutines
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
      routines: effectiveRoutines,
      date,
    })

    const { error: upsertError } = await supabase
      .from('activity_cache')
      .upsert(
        {
          profile_id: profileId,
          cache_date: date,
          window_index: windowIndex,
          duration_minutes: durationMinutes,
          routines: effectiveRoutines,
          activities,
        },
        { onConflict: 'profile_id,cache_date,window_index' }
      )

    if (upsertError) {
      console.error('Cache upsert error:', upsertError)
    }

    return NextResponse.json({ activities })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Activities API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
