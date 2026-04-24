import OpenAI from 'openai'
import { Activity, ChatMessage, WakeWindow } from '@/lib/supabase/types'

let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _client
}

export interface DailyChatRequest {
  ageMonths: number
  ageDays: number
  date: string
  wakeWindows: Array<{
    windowIndex: number
    durationMinutes: number
    startTime: string | null
    routines: string | null
    currentActivities: Activity[]
  }>
  routineStatuses: Array<{
    windowIndex: number
    routineText: string
    skipped: boolean
  }>
  history: ChatMessage[]
  userMessage: string
}

export interface DailyChatResponse {
  type: 'question' | 'schedule_update' | 'answer'
  content: string
  updatedWindows?: Array<{
    windowIndex: number
    activities: Activity[]
  }>
  routineQuestions?: Array<{
    windowIndex: number
    routineText: string
  }>
}

export async function dailyChat(req: DailyChatRequest): Promise<DailyChatResponse> {
  const { ageMonths, ageDays, date, wakeWindows, routineStatuses, history, userMessage } = req

  const windowsSummary = wakeWindows.map(w => {
    const routineStatus = routineStatuses.find(r => r.windowIndex === w.windowIndex)
    const routineInfo = w.routines
      ? `루틴: "${w.routines}"${routineStatus ? (routineStatus.skipped ? ' (오늘 스킵)' : ' (유지)') : ' (미정)'}`
      : '루틴 없음'
    const activitiesInfo = w.currentActivities.length > 0
      ? `현재 활동: ${w.currentActivities.map(a => `${a.name}(${a.duration})`).join(', ')}`
      : '활동 미생성'
    return `  깨시${w.windowIndex + 1}: ${w.durationMinutes}분, 시작 ${w.startTime ?? '미입력'}, ${routineInfo}, ${activitiesInfo}`
  }).join('\n')

  const systemPrompt = `당신은 0~12개월 영아 일일 스케줄 관리 전문가입니다.
아기 정보: ${ageDays}일 (약 ${ageMonths}개월), 날짜: ${date}

오늘의 깨시 구성:
${windowsSummary}

당신의 역할:
1. **첫 대화 시작**: 사용자에게 오늘 하루에 대해 질문합니다.
   - 외출 계획이 있는지, 몇 시에 어디 가는지
   - 아기나 부모의 컨디션은 어떤지
   - 특별한 일정(병원, 손님 방문 등)이 있는지
   - 어제 아기가 잘 잤는지

2. **루틴 확인**: 각 깨시에 설정된 루틴에 대해 오늘도 유지할지, 스킵할지 물어봅니다.
   - 루틴이 있는 깨시만 물어보세요
   - "깨시3의 '마지막 1시간 수면 루틴'을 오늘도 유지할까요?" 형태로 질문

3. **스케줄 반영**: 충분한 정보가 모이면 전체 깨시의 활동을 한번에 재구성합니다.
   - 외출 시간과 겹치는 깨시는 외출 활동으로 대체
   - 컨디션이 안 좋으면 자극 강도를 낮춘 활동 추천
   - 스킵된 루틴은 제외하고 활동 구성

응답 형식 (JSON만 출력, 다른 텍스트 금지):

질문할 때:
{"type":"question","content":"질문 내용"}

루틴 유지/스킵을 물어볼 때:
{"type":"question","content":"루틴 관련 질문","routineQuestions":[{"windowIndex":0,"routineText":"루틴 내용"}]}

스케줄을 업데이트할 때:
{"type":"schedule_update","content":"변경 이유 요약","updatedWindows":[{"windowIndex":0,"activities":[{"name":"활동명","duration":"XX분","effect":"효과"}]}]}

단순 답변일 때:
{"type":"answer","content":"답변 내용"}

대화 흐름:
- 아직 충분한 정보가 없으면 type:"question"으로 추가 질문
- 정보가 충분하면 type:"schedule_update"로 전체 스케줄 제안
- 이미 스케줄이 반영된 후 추가 질문은 type:"answer"로 응답

중요: 한 번에 2개 이상의 질문을 하지 마세요. 하나씩 자연스럽게 물어보세요.`

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ]

  const response = await getClient().chat.completions.create({
    model: 'gpt-5.4-nano',
    max_completion_tokens: 1500,
    messages,
  })

  const text = response.choices[0]?.message?.content ?? '{}'
  const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  try {
    return JSON.parse(cleaned) as DailyChatResponse
  } catch {
    return { type: 'answer', content: text || '응답을 처리할 수 없었어요.' }
  }
}
