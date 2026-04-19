import OpenAI from 'openai'
import { Activity } from '@/lib/supabase/types'

let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _client
}

interface ActivityRequest {
  ageMonths: number
  windowIndex: number      // 0-based (0 = 깨시1)
  durationMinutes: number
  date: string             // "YYYY-MM-DD" for daily variety
}

export async function generateActivities(req: ActivityRequest): Promise<Activity[]> {
  const { ageMonths, windowIndex, durationMinutes, date } = req

  const response = await getClient().chat.completions.create({
    model: 'gpt-5.4-nano',
    max_tokens: 500,
    messages: [
      {
        role: 'system',
        content: `당신은 0~12개월 영아 발달 전문가입니다.
부모가 아기와 무엇을 하면 좋을지 실용적인 활동을 추천해 주세요.
반드시 아래 JSON 배열 형식으로만 응답하세요. 설명이나 다른 텍스트 없이 JSON만 출력하세요.
[{"name":"활동명","duration":"XX분","effect":"발달 효과 한 줄"}]`,
      },
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

  const text = response.choices[0]?.message?.content ?? '[]'
  const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  try {
    const parsed = JSON.parse(cleaned)
    return (Array.isArray(parsed) ? parsed : parsed.activities ?? []) as Activity[]
  } catch {
    return []
  }
}
