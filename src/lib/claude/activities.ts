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
  ageDays: number
  ageMonths: number
  windowIndex: number       // 0-based
  totalWindows: number
  durationMinutes: number
  startTime: string | null  // "HH:MM" or null
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
  const { ageDays, ageMonths, windowIndex, totalWindows, durationMinutes, startTime, date } = req

  const feedingTime = 15
  const playTime = Math.max(10, durationMinutes - feedingTime)
  const suggestedCount = Math.max(2, Math.min(6, Math.round(playTime / 20)))

  const systemPrompt = `당신은 0~12개월 영아 발달 전문가이자 육아 코치입니다.
부모가 아기의 '깨어있는 시간(깨시)'을 알차게 채울 수 있도록 실용적이고 구체적인 활동을 추천합니다.

**핵심 원칙:**
1. 총 활동 시간의 합이 실제 놀이 시간(${playTime}분)에 가깝도록 맞추세요. 너무 짧게 끝나면 안 됩니다.
2. 활동 수는 ${suggestedCount}개 내외로, 각 활동의 duration을 합산했을 때 ${playTime}분에 ±10분 이내로 맞추세요.
3. 아기의 정확한 월령/일령에 맞는 발달 단계에 맞춰주세요 (너무 어려우면 안 되고, 너무 쉬워도 안 됨).
4. 깨시의 시간대와 순서를 고려해서 자극 강도를 조절하세요 (아침은 활발, 저녁은 차분).
5. 같은 유형 반복 금지 — 다양한 발달 영역(신체/감각/언어/정서/인지) 고루 섞기.

**응답 형식 (반드시 이 형식만):**
설명 없이 JSON 배열만 출력. 각 원소는 {"name","duration","effect"}.
duration은 "숫자 + 분" 형식 ("15분", "5분").
[{"name":"활동명","duration":"XX분","effect":"한 줄 발달 효과"}]`

  const userPrompt = `**오늘의 깨시 정보:**
- 아기 나이: ${ageDays}일 (약 ${ageMonths}개월)
- 전체 깨시 ${totalWindows}회 중 ${windowIndex + 1}번째 깨시
- 깨시 위치 힌트: ${getWindowPositionHint(windowIndex, totalWindows)}
- 시작 시간: ${startTime ?? '미입력'}
- 시간대 힌트: ${getTimeOfDayHint(startTime)}
- 전체 깨어있는 시간: ${durationMinutes}분
- 수유 예상: ${feedingTime}분 (깨시 초반에 소요됨, 활동에 포함하지 말 것)
- 실제 놀이에 쓸 수 있는 시간: ${playTime}분
- 날짜 시드: ${date}

위 정보에 맞춰 놀이 시간 ${playTime}분을 촘촘하게 채울 활동 ${suggestedCount}개를 추천해 주세요. 각 활동의 duration 합이 ${playTime}분에 근접해야 합니다.`

  const response = await getClient().chat.completions.create({
    model: 'gpt-5.4-nano',
    max_completion_tokens: 900,
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
