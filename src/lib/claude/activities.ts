import OpenAI from 'openai'
import { Activity } from '@/lib/supabase/types'
import { getDevStage, buildEvidenceContext } from './infant-dev-reference'

let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _client
}

interface ActivityRequest {
  ageDays: number
  ageMonths: number
  windowIndex: number
  totalWindows: number
  durationMinutes: number
  startTime: string | null
  routines: string | null
  date: string
}

function getTimeOfDayHint(startTime: string | null): string {
  if (!startTime) return '시간대 미지정'
  const hour = parseInt(startTime.split(':')[0], 10)
  if (hour < 9) return '이른 아침 (상쾌하게 깨우기, 밝은 자극)'
  if (hour < 12) return '오전 (활발한 놀이, 감각 자극)'
  if (hour < 15) return '이른 오후 (적당한 활동)'
  if (hour < 18) return '늦은 오후 (조금 차분한 활동)'
  return '저녁 (수면 준비, 차분한 루틴)'
}

function getWindowPositionHint(index: number, total: number): string {
  if (index === 0) return '첫 깨시 — 잠에서 막 깬 상태, 부드러운 자극부터'
  if (index === total - 1) return '마지막 깨시 — 잠자기 전 wind-down, 자극 낮추기'
  return '중간 깨시 — 집중력 좋은 시간대, 발달 활동 적극적으로'
}

export async function generateActivities(req: ActivityRequest): Promise<Activity[]> {
  const { ageDays, ageMonths, windowIndex, totalWindows, durationMinutes, startTime, routines, date } = req

  const stage = getDevStage(ageMonths)
  const evidenceContext = buildEvidenceContext(ageMonths, ageDays)

  const routineBlock = routines
    ? `\n\n**사용자 고정 루틴 (반드시 반영):**\n${routines}\n고정 루틴은 JSON 배열에 포함시키되, 나머지 시간을 자유 활동으로 채우세요. 고정 루틴의 name은 사용자가 쓴 표현을 그대로 살려주세요.`
    : ''

  const systemPrompt = `당신은 영아 발달 전문가이며, 반드시 아래 제공되는 근거 자료에 기반하여 활동을 추천합니다.

${evidenceContext}

**핵심 원칙 (근거 기반):**

1. **적정 활동량**: 깨시 전체를 활동으로 꽉 채우지 마세요. 위 가이드라인에 명시된 적정 비율을 따르세요.
   - 깨시 = 수유(초반) + 구조화된 놀이 + 자유탐색/쉬는시간 + 수면 전 안정
   - "활동"으로 추천하는 것은 구조화된 놀이 부분만입니다.

2. **활동별 시간**: 각 활동의 duration은 위 "주의집중 시간" 근거에 맞추세요.
   - ${stage.attentionSpan}
   - 한 활동이 이 범위를 크게 넘지 않도록 하세요.

3. **발달 단계 적합성**: 위 CDC 이정표와 적합한 활동 예시를 참고하여, 아기가 현재 할 수 있거나 조금 도전적인 수준의 활동만 추천하세요.

4. **과자극 방지**: 활동 목록 마지막에 "자유 탐색 / 쉬는 시간" 항목을 포함하여 부모가 아기의 신호에 따라 쉴 수 있도록 하세요.

5. **시간대 고려**: 아침은 활발한 신체 활동, 저녁은 차분한 감각/정서 활동 위주.

6. **다양성**: 신체/감각/언어/정서/인지 영역을 고루 섞되, 같은 유형 반복 금지.${routineBlock}

**응답 형식 (반드시 이 형식만):**
JSON 배열만 출력. 각 원소는 {"name","duration","effect"}.
- duration은 "숫자 + 분" 형식 ("5분", "10분")
- effect에는 발달 효과와 함께 근거(WHO/CDC/AAP 등)를 간단히 표기
- 마지막 항목으로 "자유 탐색 / 쉬는 시간"을 넣어 나머지 시간을 아기 주도로 보낼 수 있게 하세요

예시:
[{"name":"터미타임","duration":"5분","effect":"상체 근력 발달 (WHO: 하루 30분+ 권장)"},{"name":"자유 탐색 / 쉬는 시간","duration":"10분","effect":"아기 주도 탐색. 과자극 신호(고개 돌림, 하품) 보이면 안아주세요."}]`

  const userPrompt = `**오늘의 깨시 정보:**
- 아기 나이: ${ageDays}일 (약 ${ageMonths}개월)
- 전체 깨시 ${totalWindows}회 중 ${windowIndex + 1}번째 깨시
- 깨시 위치: ${getWindowPositionHint(windowIndex, totalWindows)}
- 시작 시간: ${startTime ?? '미입력'}
- 시간대: ${getTimeOfDayHint(startTime)}
- 전체 깨어있는 시간: ${durationMinutes}분
- 날짜: ${date}${routines ? `\n- 고정 루틴: ${routines}` : ''}

위 근거 자료와 가이드라인에 기반하여 이 깨시에 적합한 활동을 추천해 주세요.
- 깨시 전체를 꽉 채우지 말고, 수유·자유탐색·안정 시간을 고려한 적정량만 추천하세요.
- 각 활동의 duration은 이 월령의 주의집중 시간(${stage.attentionSpan})에 맞추세요.
- 마지막에 "자유 탐색 / 쉬는 시간"을 포함하세요.`

  const response = await getClient().chat.completions.create({
    model: 'gpt-5.4-nano',
    max_completion_tokens: 1000,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
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
