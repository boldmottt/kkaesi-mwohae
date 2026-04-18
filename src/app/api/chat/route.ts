import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/claude/chat'

export async function POST(req: NextRequest) {
  try {
    const { ageMonths, windowIndex, durationMinutes, currentActivities, history, userMessage } =
      await req.json()

    if (!userMessage || ageMonths === undefined || windowIndex === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const response = await chat({
      ageMonths,
      windowIndex,
      durationMinutes,
      currentActivities: currentActivities ?? [],
      history: history ?? [],
      userMessage,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 })
  }
}
