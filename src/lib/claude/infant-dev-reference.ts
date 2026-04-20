/**
 * 영아 발달 근거 자료 (Evidence-Based Infant Development Reference)
 *
 * 출처:
 * - WHO Guidelines on Physical Activity, Sedentary Behaviour and Sleep for Children Under 5 (2019)
 * - CDC Developmental Milestones — Learn the Signs. Act Early. (2022 revised)
 * - AAP Tummy Time Recommendations (2023)
 * - Zero to Three: Play Activities for Birth to 12 Months
 * - Harvard Center on the Developing Child: Brain-Building Through Play
 * - Healthychildren.org (AAP): Cognitive Development 8-12 Months
 * - Infant attention span research: ~2-3 min per month of age (Brain Balance Centers)
 */

export interface DevStageData {
  ageRange: string
  whoPhysicalActivity: string
  tummyTime: string
  attentionSpan: string
  sleepNeeds: string
  cdcMilestones: string[]
  appropriateActivities: string[]
  activityDurationGuideline: string
  overstimulationNote: string
  screenTime: string
}

export const DEV_STAGES: DevStageData[] = [
  {
    ageRange: '0-2개월',
    whoPhysicalActivity: '하루 여러 차례 다양한 방식으로 신체 활동(특히 바닥 놀이). 아직 이동 불가한 영아는 하루 최소 30분 터미타임(엎드려 놀기).',
    tummyTime: '1개월: 하루 총 15분 / 2개월: 하루 총 15-30분. 한 세션당 3-5분씩 나누어. (AAP)',
    attentionSpan: '한 활동에 1-3분. 신생아는 자극에 매우 빠르게 피로해짐.',
    sleepNeeds: '14-17시간 (WHO). 깨시 30-60분이 일반적.',
    cdcMilestones: [
      '말하거나 안아주면 진정됨',
      '얼굴을 바라봄',
      '말하거나 웃으면 미소 지음',
      '울음 외의 소리를 냄',
      '큰 소리에 반응',
      '움직이는 사람을 눈으로 따라감',
      '장난감을 수 초간 바라봄',
      '엎드리면 고개를 들어올림',
      '양팔·양다리를 움직임',
      '손을 잠깐 펼침'
    ],
    appropriateActivities: [
      '터미타임(3-5분씩)',
      '흑백 고대비 그림/카드 보여주기',
      '부드러운 목소리로 말걸기·노래 부르기',
      '딸랑이 소리 들려주기(좌우로)',
      '얼굴 보며 표정 따라하기',
      '부드러운 촉감 놀이(다른 질감 천)',
      '아기 마사지',
      '거울 보여주기',
      '안아서 흔들기·걷기'
    ],
    activityDurationGuideline: '한 활동 1-3분. 활동 사이 쉬는 시간 필수. 깨시 전체를 꽉 채우지 말 것 — 수유+짧은 놀이+안정 시간으로 구성. 활동 총합은 깨시의 40-60% 정도가 적정.',
    overstimulationNote: '고개 돌림, 시선 회피, 울음, 하품, 주먹 꽉 쥠, 등 뒤로 젖힘이 과자극 신호. 즉시 자극을 줄이고 안아주거나 조용한 환경 제공.',
    screenTime: '스크린 타임 권장하지 않음 (WHO). 영상통화만 예외.'
  },
  {
    ageRange: '3-4개월',
    whoPhysicalActivity: '하루 여러 차례 바닥 놀이. 터미타임 포함. 한 번에 1시간 이상 구속(유모차/카시트) 금지.',
    tummyTime: '3개월: 하루 총 30-60분 / 4개월: 하루 총 60분+. 한 세션 10분까지 가능. (AAP/Nationwide Children\'s)',
    attentionSpan: '한 활동에 3-5분. 관심이 늘지만 여전히 짧음.',
    sleepNeeds: '12-16시간 (WHO). 깨시 75-120분.',
    cdcMilestones: [
      '당신이 멀리 가면 울음 등으로 반응 (관심 요구)',
      '거울 속 자기를 보고 웃음',
      '옹알이 시작',
      '장난감에 손 뻗기',
      '입으로 탐색',
      '엎드린 상태에서 팔꿈치로 몸 지지',
      '뒤집기 시도'
    ],
    appropriateActivities: [
      '터미타임(5-10분씩)',
      '손 뻗어 잡기 놀이(딸랑이, 천 인형)',
      '까꿍 놀이 시작',
      '거울 놀이',
      '다양한 질감 탐색(부드러운 공, 나무 블록)',
      '노래 부르며 손동작(작은 별 등)',
      '색깔 있는 모빌/장난감 따라보기',
      '배 위에서 비행기 놀이',
      '그림책 읽어주기(밝은 색상)'
    ],
    activityDurationGuideline: '한 활동 3-5분. 2-3개 활동 후 쉬는 시간. 깨시의 50-70%를 활동으로 채우는 것이 적정.',
    overstimulationNote: '시선 회피, 몸 비틀기, 짜증스러운 울음, 빨기 행동 증가가 과자극 신호. 활동 강도를 낮추고 안정 시간 제공.',
    screenTime: '스크린 타임 권장하지 않음 (WHO).'
  },
  {
    ageRange: '5-6개월',
    whoPhysicalActivity: '하루 여러 차례 다양한 신체 활동. 바닥 탐색 시간 확대.',
    tummyTime: '하루 총 60-90분. 이 시기에는 터미타임 중 팔짚기·물건 잡기까지 가능. (AAP)',
    attentionSpan: '한 활동에 5-8분. 물건 조작에 집중 가능.',
    sleepNeeds: '12-16시간 (WHO). 깨시 2-3시간.',
    cdcMilestones: [
      '아는 사람을 보고 기뻐함',
      '소리 나는 쪽을 봄',
      '입에 물건 넣기',
      '손 뻗어 장난감 잡기',
      '장난감을 한 손에서 다른 손으로 옮기기',
      '엎드린 상태에서 팔 펴고 지지',
      '뒤집기 성공'
    ],
    appropriateActivities: [
      '앉기 연습(지지하며)',
      '물건 잡고 옮기기 놀이',
      '촉감 탐색(물놀이, 다양한 질감)',
      '까꿍 놀이(천/손)',
      '딸랑이·소리 나는 장난감 탐색',
      '노래·손유희(곰 세 마리 등)',
      '안전한 거울 놀이',
      '그림책 함께 보기(질감 책)',
      '바운서/매트 위에서 발차기 놀이'
    ],
    activityDurationGuideline: '한 활동 5-8분. 깨시의 50-70%를 활동으로 채우되, 나머지는 자유 탐색+안정 시간. 수유 시간 별도.',
    overstimulationNote: '고개 돌림, 울음, 하품 반복, 눈 비비기가 과자극 신호. 조용한 안기·흔들기로 전환.',
    screenTime: '스크린 타임 권장하지 않음 (WHO).'
  },
  {
    ageRange: '7-9개월',
    whoPhysicalActivity: '하루 여러 차례 다양한 신체 활동. 기기/잡고서기 등 대근육 발달 활동 권장.',
    tummyTime: '하루 총 60-90분+. 이 시기에는 기기 자체가 터미타임 역할.',
    attentionSpan: '한 활동에 5-10분. 12개월에 가까워지면 15분까지 가능(AAP Healthychildren.org).',
    sleepNeeds: '12-16시간 (WHO). 깨시 2.5-3.5시간.',
    cdcMilestones: [
      '낯가림 시작',
      '표정·감정 반응',
      '"안 돼" 등 간단한 말에 반응',
      '다양한 소리 냄',
      '물건의 떨어지는 것을 눈으로 추적',
      '물건을 입·손으로 탐색',
      '도움 없이 앉기',
      '네발 기기 또는 배밀이'
    ],
    appropriateActivities: [
      '기기 격려(장난감을 살짝 멀리 놓기)',
      '잡고 일어서기 연습',
      '컵·블록 넣고 빼기 놀이',
      '까꿍·숨바꼭질 놀이',
      '박수치기·손뼉 놀이',
      '음악에 맞춰 몸 흔들기',
      '간단한 원인-결과 장난감(버튼 누르면 소리)',
      '음식 탐색(BLW 시작 시)',
      '그림책 넘기기(보드북)',
      '공 굴리기'
    ],
    activityDurationGuideline: '한 활동 5-10분. 깨시의 60-75%를 활동+자유탐색으로 채우기. 이동 능력이 생기면 자유 탐색 시간 자체가 발달 활동.',
    overstimulationNote: '울음, 기어서 도망가기, 안기려 함, 눈 비비기가 과자극 신호. 조용한 공간에서 안기·그림책으로 전환.',
    screenTime: '스크린 타임 권장하지 않음 (WHO).'
  },
  {
    ageRange: '10-12개월',
    whoPhysicalActivity: '하루 여러 차례 다양한 신체 활동. 걷기 시도·가구 잡고 이동 등 적극적 움직임.',
    tummyTime: '기기·걷기로 자연스럽게 충족. 별도 터미타임 불필요.',
    attentionSpan: '한 활동에 8-15분. 좋아하는 장난감에 오래 집중 가능.',
    sleepNeeds: '12-16시간 (WHO). 깨시 2.5-4시간.',
    cdcMilestones: [
      '원하는 것을 손가락으로 가리킴',
      '이름 부르면 반응',
      '"안 돼" 이해',
      '"엄마" "맘마" 등 의미 있는 말 시작',
      '물건을 통에 넣기',
      '혼자 일어서기/걸음마 시도',
      '엄지-검지로 작은 물건 집기(집게잡기)'
    ],
    appropriateActivities: [
      '걸음마 연습(손잡고/밀차)',
      '블록 쌓기·무너뜨리기',
      '통에 물건 넣고 빼기',
      '공 주고받기',
      '간단한 악기 놀이(마라카스, 북)',
      '크레용으로 끼적이기',
      '숨긴 물건 찾기 놀이(대상영속성)',
      '손가락 인형 놀이',
      '모방 놀이(전화기, 빗질 흉내)',
      '그림책 읽기(가리키며 이름 말하기)',
      '야외 탐색(잔디·모래·자연물)'
    ],
    activityDurationGuideline: '한 활동 8-15분. 깨시의 60-75%를 활동+자유탐색으로 채우기. 이 시기 아기는 스스로 놀이를 주도하기 시작하므로 부모는 관찰+반응 역할.',
    overstimulationNote: '짜증, 물건 던지기, 울며 안기려 함, 하품, 눈 비비기가 과자극 신호. 활동을 중단하고 차분한 안기·노래로 전환.',
    screenTime: '스크린 타임 권장하지 않음 (WHO). 1세 미만 전면 비권장.'
  }
]

export function getDevStage(ageMonths: number): DevStageData {
  if (ageMonths <= 2) return DEV_STAGES[0]
  if (ageMonths <= 4) return DEV_STAGES[1]
  if (ageMonths <= 6) return DEV_STAGES[2]
  if (ageMonths <= 9) return DEV_STAGES[3]
  return DEV_STAGES[4]
}

export function buildEvidenceContext(ageMonths: number, ageDays: number): string {
  const stage = getDevStage(ageMonths)
  return `
**[근거 기반 발달 정보 — ${stage.ageRange} (${ageDays}일, 약 ${ageMonths}개월)]**

📋 출처: WHO 2019 / CDC Milestones 2022 / AAP Tummy Time / Zero to Three / Harvard Center on the Developing Child

🏃 WHO 신체활동 권장: ${stage.whoPhysicalActivity}
🫒 터미타임: ${stage.tummyTime}
🧠 주의집중 시간: ${stage.attentionSpan}
😴 수면 필요량: ${stage.sleepNeeds}
📵 스크린: ${stage.screenTime}

📌 이 월령의 CDC 발달 이정표:
${stage.cdcMilestones.map(m => `  - ${m}`).join('\n')}

✅ 이 월령에 적합한 활동 예시:
${stage.appropriateActivities.map(a => `  - ${a}`).join('\n')}

⏱️ 활동 시간 가이드라인: ${stage.activityDurationGuideline}

⚠️ 과자극 신호: ${stage.overstimulationNote}
`.trim()
}
