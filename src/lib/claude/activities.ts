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

function parseRoutineDuration(routineText: string): number | null {
  const hourMinMatch = routineText.match(/(\d+)\s*시간\s*(\d+)\s*분/)
  if (hourMinMatch) {
    return parseInt(hourMinMatch[1], 10) * 60 + parseInt(hourMinMatch[2], 10)
  }
  const hourMatch = routineText.match(/(\d+)\s*시간/)
  if (hourMatch) return parseInt(hourMatch[1], 10) * 60
  const minMatch = routineText.match(/(\d+)\s*분/)
  if (minMatch) return parseInt(minMatch[1], 10)
  return null
}

function parseRoutinePosition(routineText: string): 'start' | 'middle' | 'end' {
  if (/마지막|끝|후반|잠자기\s*전|잠들기\s*전|수면\s*전/.test(routineText)) return 'end'
  if (/처음|시작|초반|일어나|깨자마자/.test(routineText)) return 'start'
  return 'middle'
}

export async function generateActivities(req: ActivityRequest): Promise<Activity[]> {
  const { ageDays, ageMonths, windowIndex, totalWindows, durationMinutes, startTime, routines, date } = req

  const stage = getDevStage(ageMonths)
  const evidenceContext = buildEvidenceContext(ageMonths, ageDays)

  let routineActivity: Activity | null = null
  let routineDurationMinutes = 0
  let routinePosition: 'start' | 'middle' | 'end' = 'end'

  if (routines) {
    const parsedDuration = parseRoutineDuration(routines)
    routineDurationMinutes = parsedDuration ?? 30
    routinePosition = parseRoutinePosition(routines)
    routineActivity = {
      name: `📌 ${routines}`,
      duration: `${routineDurationMinutes}분`,
      effect: '사용자 지정 고정 루틴',
      category: 'other' as const,
    }
  }

  const availableMinutes = Math.max(10, durationMinutes - routineDurationMinutes)

  let routinePromptBlock = ''
  let freeExploreInstruction = '마지막 항목으로 "자유 탐색 / 쉬는 시간"을 포함하세요.'

  if (routines) {
    if (routinePosition === 'end') {
      routinePromptBlock = `\n\n**⚠️ 중요: 이 깨시의 마지막 ${routineDurationMinutes}분은 사용자의 고정 루틴("${routines}")이 차지합니다.**\n→ 당신은 깨시의 앞부분 ${availableMinutes}분에 대해서만 활동을 추천하세요.\n→ 마지막은 고정 루틴으로 끝나므로, "자유 탐색 / 쉬는 시간" 항목을 넣지 마세요.\n→ 수면 루틴, 목욕, 마사지, 자장가, wind-down 등 루틴과 겹칠 수 있는 활동은 절대 추천하지 마세요.\n→ 추천 활동의 후반부로 갈수록 점점 차분한 활동을 배치하여 루틴으로 자연스럽게 이어지도록 하세요.`
      freeExploreInstruction = '"자유 탐색 / 쉬는 시간" 항목은 넣지 마세요. 이 깨시는 고정 루틴으로 마무리됩니다.'
    } else if (routinePosition === 'start') {
      routinePromptBlock = `\n\n**⚠️ 중요: 이 깨시의 처음 ${routineDurationMinutes}분은 사용자의 고정 루틴("${routines}")이 차지합니다.**\n→ 당신은 루틴 이후의 ${availableMinutes}분에 대해서만 활동을 추천하세요.\n→ 루틴과 겹치는 활동은 절대 추천하지 마세요.\n→ 루틴 직후이므로 첫 활동은 부드럽게 시작하세요.`
    } else {
      routinePromptBlock = `\n\n**⚠️ 중요: 이 깨시 중간에 사용자의 고정 루틴("${routines}", ${routineDurationMinutes}분)이 있습니다.**\n→ 당신은 루틴을 제외한 나머지 ${availableMinutes}분에 대해서만 활동을 추천하세요.\n→ 루틴과 겹치는 활동은 절대 추천하지 마세요.`
    }
  }

  const systemPrompt = `당신은 영아 발달 전문가이며, 반드시 아래 제공되는 근거 자료에 기반하여 활동을 추천합니다.

${evidenceContext}

**핵심 원칙 (근거 기반):**

1. **적정 활동량**: 깨시 전체를 활동으로 꽉 채우지 마세요. 위 가이드라인에 명시된 적정 비율을 따르세요.
   - 깨시 = 수유(초반) + 구조화된 놀이 + 자유탐색/쉬는시간 + 수면 전 안정

2. **활동별 시간**: 각 활동의 duration은 위 "주의집중 시간" 근거에 맞추세요.
   - ${stage.attentionSpan}

3. **발달 단계 적합성**: 위 CDC 이정표와 적합한 활동 예시를 참고하세요.

4. **과자극 방지**: ${freeExploreInstruction}

5. **시간대 고려**: 아침은 활발한 신체 활동, 저녁은 차분한 감각/정서 활동 위주.

6. **다양성**: 신체/감각/언어/정서/인지 영역을 고루 섞기.${routinePromptBlock}

**응답 형식 (반드시 이 형식만):**
JSON 배열만 출력. 각 원소는 {"name","duration","effect","category"}.
- duration은 "숫자 + 분" 형식 ("5분", "10분")
- effect에는 발달 효과와 함께 근거(WHO/CDC/AAP 등)를 간단히 표기
- category는 반드시 다음 6개 중 하나: "physical", "sensory", "language", "cognitive", "emotional", "other"
  - physical: 터미타임, 뒤집기, 기기, 걸음마, 발차기, 앉기 연습 등 신체/운동 활동
  - sensory: 촉감 놀이, 딸랑이, 물놀이, 거울, 모빌, 다양한 질감 탐색 등 감각 자극 활동
  - language: 노래, 그림책, 말걸기, 옹알이 대화, 손유희, 이름 불러주기 등 언어 활동
  - cognitive: 까꿍, 숨긴 물건 찾기, 원인-결과 장난감, 블록 넣고 빼기, 모방 놀이 등 인지 활동
  - emotional: 마사지, 안아주기, 표정 따라하기, 눈맞춤, 스킨십, 자장가 등 정서/사회성 활동
  - other: 고정 루틴, 자유 탐색, 쉬는 시간 등 위 카테고리에 맞지 않는 활동

예시:
[{"name":"터미타임","duration":"5분","effect":"상체 근력 발달 (WHO: 하루 30분+ 권장)","category":"physical"}]`

  const userPrompt = `**이 깨시에서 활동을 추천할 가용 시간: ${availableMinutes}분**
(전체 깨시 ${durationMinutes}분${routines ? ` - 고정 루틴 ${routineDurationMinutes}분` : ''})

- 아기 나이: ${ageDays}일 (약 ${ageMonths}개월)
- 전체 깨시 ${totalWindows}회 중 ${windowIndex + 1}번째
- 깨시 위치: ${getWindowPositionHint(windowIndex, totalWindows)}
- 시작 시간: ${startTime ?? '미입력'}
- 시간대: ${getTimeOfDayHint(startTime)}
- 날짜: ${date}

${availableMinutes}분 내에서 적정량의 활동을 추천해 주세요.${routinePosition === 'end' ? ' 이 깨시는 고정 루틴으로 마무리되므로, 마지막에 "자유 탐색 / 쉬는 시간"을 넣지 마세요.' : ''}`

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

  let aiActivities: Activity[] = []
  try {
    const parsed = JSON.parse(cleaned)
    aiActivities = (Array.isArray(parsed) ? parsed : parsed.activities ?? []) as Activity[]
  } catch {
    aiActivities = []
  }

  // end 루틴: AI가 무시하고 넣은 wind-down/자유탐색 계열 제거
  if (routineActivity && routinePosition === 'end') {
    aiActivities = aiActivities.filter(a =>
      !a.name.includes('자유') &&
      !a.name.includes('쉬는') &&
      !a.name.includes('안정') &&
      !a.name.includes('wind') &&
      !a.name.includes('수면') &&
      !a.name.includes('목욕') &&
      !a.name.includes('마사지') &&
      !a.name.includes('자장가')
    )
  }

  // start 루틴: 루틴 키워드와 겹치는 AI 활동 제거
  if (routineActivity && routinePosition === 'start') {
    const routineKeywords = routines!.split(/[\s,/→·]+/).filter(w => w.length >= 2)
    aiActivities = aiActivities.filter(a =>
      !routineKeywords.some(kw => a.name.includes(kw))
    )
  }

  // 루틴을 코드에서 정확한 위치에 삽입
  if (routineActivity) {
    if (routinePosition === 'start') {
      return [routineActivity, ...aiActivities]
    } else if (routinePosition === 'end') {
      return [...aiActivities, routineActivity]
    } else {
      const mid = Math.floor(aiActivities.length / 2)
      return [...aiActivities.slice(0, mid), routineActivity, ...aiActivities.slice(mid)]
    }
  }

  return aiActivities
}
