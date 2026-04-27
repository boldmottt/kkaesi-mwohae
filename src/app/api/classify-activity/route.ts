import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { requireAuth } from '@/lib/auth-middleware'

let _client: OpenAI | null = null
function getClient(): OpenAI {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _client
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  try {
    const { activityName } = await req.json()

    if (!activityName) {
      return NextResponse.json({ category: 'other' })
    }

    const response = await getClient().chat.completions.create({
      model: 'gpt-5.4-nano',
      max_completion_tokens: 20,
      messages: [
        {
          role: 'system',
          content: '영아 활동을 분류합니다. 반드시 다음 중 하나만 출력하세요: physical, sensory, language, cognitive, emotional\n\n- physical: 터미타임, 뒤집기, 기기, 걸음마, 산책, 발차기, 수영 등 신체 운동\n- sensory: 촉감놀이, 물놀이, 거울, 딸랑이, 모빌, 음악감상 등 감각 자극\n- language: 노래, 그림책, 말걸기, 옹알이, 손유희 등 언어\n- cognitive: 까꿍, 블록, 숨긴물건찾기, 퍼즐, 모방놀이 등 인지\n- emotional: 마사지, 안아주기, 스킨십, 눈맞춤, 자장가 등 정서\n\n한 단어만 출력하세요.',
        },
        {
          role: 'user',
          content: activityName,
        },
      ],
    })

    const text = (response.choices[0]?.message?.content ?? 'other').trim().toLowerCase()
    const valid = ['physical', 'sensory', 'language', 'cognitive', 'emotional']
    const category = valid.includes(text) ? text : 'other'

    return NextResponse.json({ category })
  } catch {
    return NextResponse.json({ category: 'other' })
  }
}
