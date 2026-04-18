import Anthropic from '@anthropic-ai/sdk'
import { Activity } from '@/lib/supabase/types'

const client = new Anthropic()

interface ActivityRequest {
  ageMonths: number
  windowIndex: number      // 0-based (0 = 깨시1)
  durationMinutes: number
  date: string             // "YYYY-MM-DD" for daily variety
}

export async function generateActivities(req: ActivityRequest): Promise<Activity[]> {
  const { ageMonths, windowIndex, durationMinutes, date } = req

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: `당신은 0~12개월 영아 발달 전문가입니다.
부모가 아기와 무엇을 하면 좋을지 실용적인 활동을 추천해 주세요.
항상 아래 JSON 배열 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.
[{"name":"활동명","duration":"XX분","effect":"발달 효과 한 줄"}]`,
    messages: [
      {
        role: 'user',
        content: `아기 나이: ${ageMonths}개월
깨시 번호: ${windowIndex + 1}번째 깨시 (하루 중 순서)
깨어있는 시간: ${durationMinutes}분
날짜 시드: ${date}

이 깨시에 맞는 활동 3가지를 추천해 주세요.`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]'

  // Claude sometimes wraps JSON in markdown code blocks — strip them
  const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  try {
    return JSON.parse(cleaned) as Activity[]
  } catch {
    return []
  }
}
