import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

let _client: OpenAI | null = null
function getClient(): OpenAI {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _client
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const profileId = searchParams.get('profileId')
    const month = searchParams.get('month')

    if (!profileId || !month) {
      return NextResponse.json({ error: 'profileId and month required' }, { status: 400 })
    }

    // 1. 캐시 확인 (daily_summaries 테이블 재활용, date를 YYYY-MM-01로 저장)
    const cacheDate = `${month}-01`
    const { data: existing } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('profile_id', profileId)
      .eq('summary_date', cacheDate)
      .single()

    if (existing) {
      return NextResponse.json({ comment: existing.summary, cached: true })
    }

    // 2. 해당 월의 활동 로그 가져오기
    const [y, m] = month.split('-').map(Number)
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`
    const lastDay = new Date(y, m, 0).getDate()
    const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const { data: logs, error: logsError } = await supabase
      .from('activity_logs')
      .select('activity_name, activity_duration, category, did, rating, note, window_index, log_date')
      .eq('profile_id', profileId)
      .gte('log_date', startDate)
      .lte('log_date', endDate)

    if (logsError) throw logsError

    const meaningful = (logs ?? []).filter(
      l => l.did || (l.note && l.note.trim().length > 0) || l.rating !== 0
    )

    if (meaningful.length === 0) {
      return NextResponse.json({ comment: null, cached: false, reason: 'no_data' })
    }

    // 3. 통계 집계
    const catCounts: Record<string, number> = {}
    let totalMin = 0
    const liked: string[] = []
    const disliked: string[] = []
    const activeDays = new Set<string>()

    for (const log of meaningful) {
      const cat = log.category ?? 'other'
      catCounts[cat] = (catCounts[cat] ?? 0) + 1
      const durMatch = (log.activity_duration ?? '').match(/(\d+)/)
      if (durMatch) totalMin += parseInt(durMatch[1], 10)
      if (log.rating === 1) liked.push(log.activity_name)
      if (log.rating === -1) disliked.push(log.activity_name)
      activeDays.add(log.log_date)
    }

    const catLabels: Record<string, string> = {
      physical: '신체', sensory: '감각', language: '언어',
      cognitive: '인지', emotional: '정서', other: '기타',
    }

    const catSummary = Object.entries(catCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, count]) => `${catLabels[cat] ?? cat} ${count}개`)
      .join(', ')

    // 4. 발달 단계 맥락 (Supabase에서 age_months 가져오기)
    let devStage = ''
    const { data: profile } = await supabase
      .from('profiles')
      .select('age_months, developmental_stage')
      .eq('id', profileId)
      .single()

    const ageMonths = (profile as { age_months?: number } | null)?.age_months
    if (ageMonths) {
      if (ageMonths < 12) devStage = '영유아 (0-12개월)'
      else if (ageMonths < 24) devStage = '후기 영유아 (12-24개월)'
      else if (ageMonths < 36) devStage = '유아 (24-36개월)'
      else if (ageMonths < 48) devStage = '중기 유아 (36-48개월)'
      else if (ageMonths < 60) devStage = '후기 유아 (48-60개월)'
      else devStage = '취학전 (60개월+)'
    }

    // 5. 프롬프트 구성 및 AI 호출
    const prompt = `다음은 ${month}월의 아동 활동 데이터입니다. 월간 발달 코멘트를 작성해주세요.

데이터 요약:
- 총 ${meaningful.length}개 활동, ${activeDays.size}일 기록, 총 ${totalMin}분
- 카테고리: ${catSummary}
- 발달 단계: ${devStage || '정보 없음'}
- 좋아한 활동: ${liked.length > 0 ? [...new Set(liked)].slice(0, 5).join(', ') : '없음'}
- 싫어한 활동: ${disliked.length > 0 ? [...new Set(disliked)].slice(0, 5).join(', ') : '없음'}

규칙:
1. 첫 문장: 이번 달 전체적인 활동 패턴을 따뜻하게 요약
2. 둘째 문장: 발달 단계를 고려한 강점 또는 칭찬
3. 셋째 문장: 부족한 영역에 대한 부드러운 제안 (구체적 활동 예시 1개 포함)
4. 한국어로 작성, 존댓말, 따옴표 없이 출력`

    const response = await getClient().chat.completions.create({
      model: 'gpt-5.4-nano',
      max_completion_tokens: 200,
      messages: [
        { role: 'system', content: prompt },
      ],
    })

    const comment = (response.choices[0]?.message?.content ?? '').trim()

    if (!comment) {
      return NextResponse.json({ comment: null, cached: false, reason: 'generation_failed' })
    }

    // 6. 캐시 저장
    await supabase
      .from('daily_summaries')
      .upsert({
        profile_id: profileId,
        summary_date: cacheDate,
        summary: comment,
      }, { onConflict: 'profile_id,summary_date' })

    return NextResponse.json({ comment, cached: false })
  } catch (error: unknown) {
    let message = '알 수 없는 오류'
    if (error instanceof Error) message = error.message
    else if (typeof error === 'string') message = error
    else message = JSON.stringify(error)
    console.error('Monthly insight error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
