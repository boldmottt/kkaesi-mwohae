import Anthropic from '@anthropic-ai/sdk'
import { Activity, ChatMessage, ChatResponse } from '@/lib/supabase/types'

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic()
  }
  return _client
}

export function detectResponseType(response: ChatResponse): 'update' | 'answer' {
  return response.type
}

interface ChatRequest {
  ageMonths: number
  windowIndex: number
  durationMinutes: number
  currentActivities: Activity[]
  history: ChatMessage[]
  userMessage: string
}

export async function chat(req: ChatRequest): Promise<ChatResponse> {
  const { ageMonths, windowIndex, durationMinutes, currentActivities, history, userMessage } = req

  const systemPrompt = `당신은 0~12개월 영아 발달 전문가이자 육아 상담사입니다.
현재 아기 정보:
- 나이: ${ageMonths}개월
- 깨시${windowIndex + 1} (${durationMinutes}분)
- 현재 추천 활동: ${currentActivities.map(a => a.name).join(', ')}

사용자 질문/요청에 따라 두 가지 방식으로만 응답하세요:

1. 질문에 답변만 할 경우 (활동 변경 없음):
{"type":"answer","content":"답변 내용"}

2. 활동 추천을 바꿔야 할 경우 (외출, 컨디션 등 조건 변경):
{"type":"update","content":"변경 이유 한 문장","activities":[{"name":"활동명","duration":"XX분","effect":"효과"},...]}

JSON만 출력하세요. 다른 텍스트는 절대 포함하지 마세요.`

  const messages: Anthropic.MessageParam[] = [
    ...history.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ]

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    system: systemPrompt,
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  try {
    return JSON.parse(cleaned) as ChatResponse
  } catch {
    return { type: 'answer', content: cleaned || '응답을 처리할 수 없었어요.' }
  }
}
