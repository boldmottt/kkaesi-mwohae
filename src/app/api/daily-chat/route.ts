import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dailyChat } from '@/lib/claude/daily-chat'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      profileId,
      ageMonths,
      ageDays,
      date,
      wakeWindows,
      routineStatuses,
      history,
      userMessage,
    } = await req.json()

    if (!profileId || !date || !userMessage || ageMonths === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const response = await dailyChat({
      ageMonths,
      ageDays,
      date,
      wakeWindows: wakeWindows ?? [],
      routineStatuses: routineStatuses ?? [],
      history: history ?? [],
      userMessage,
    })

    const newMessages = [
      ...(history ?? []),
      { role: 'user', content: userMessage },
      { role: 'assistant', content: response.content },
    ]

    await supabase
      .from('daily_chat_sessions')
      .upsert(
        {
          profile_id: profileId,
          chat_date: date,
          messages: newMessages,
          schedule_applied: response.type === 'schedule_update',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'profile_id,chat_date' }
      )

    if (response.type === 'schedule_update' && response.updatedWindows) {
      for (const uw of response.updatedWindows) {
        await supabase
          .from('activity_cache')
          .upsert(
            {
              profile_id: profileId,
              cache_date: date,
              window_index: uw.windowIndex,
              activities: uw.activities,
            },
            { onConflict: 'profile_id,cache_date,window_index' }
          )
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Daily chat API error:', error)
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 })
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

    if (!profileId || !date) {
      return NextResponse.json({ error: 'Missing profileId or date' }, { status: 400 })
    }

    const { data: session } = await supabase
      .from('daily_chat_sessions')
      .select('*')
      .eq('profile_id', profileId)
      .eq('chat_date', date)
      .maybeSingle()

    const { data: routineStatuses } = await supabase
      .from('daily_routine_status')
      .select('*')
      .eq('profile_id', profileId)
      .eq('status_date', date)

    return NextResponse.json({
      session: session ?? null,
      routineStatuses: routineStatuses ?? [],
    })
  } catch (error) {
    console.error('Daily chat GET error:', error)
    return NextResponse.json({ error: 'Failed to load chat' }, { status: 500 })
  }
}
