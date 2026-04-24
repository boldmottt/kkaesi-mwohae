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
    const date = searchParams.get('date')

    if (!profileId || !date) {
      return NextResponse.json({ error: 'profileId and date required' }, { status: 400 })
    }

    // 1. 저장된 요약이 있는지 확인
    const { data: existing } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('profile_id', profileId)
      .eq('summary_date', date)
      .single()

    if (existing) {
      return NextResponse.json({ summary: existing.summary, cached: true })
    }

    // 2. 해당 날짜의 활동 로그 가져오기
    const { data: logs, error: logsError } = await supabase
      .from('activity_logs')
      .select('activity_name, activity_duration, category, did, rating, note, window_index')
      .eq('profile_id', profileId)
      .eq('log_date', date)

    if (logsError) throw logsError

    // 의미있는 로그만 필터
    const meaningful = (logs ?? []).filter(
      l => l.did || (l.note && l.note.trim().length > 0) || l.rating !== 0
    )

    if (meaningful.length === 0) {
      return NextResponse.json({ summary: null, cached: false, reason: 'no_logs' })
    }

    // 3. 프로필에서 아기 이름 가져오기
    const { data: profile } = await supabase
      .from('profiles')
      .select('baby_name, birth_date')
      .eq('id', profileId)
      .single()

    const babyName = profile?.baby_name ?? '아기'

    // 카테고리별 집계
    const catCounts: Record<string, number> = {}
    let totalMin = 0
    const liked: string[] = []
    const disliked: string[] = []

    for (const log of meaningful) {
      const cat = log.category ?? 'other'
      catCounts[cat] = (catCounts[cat] ?? 0) + 1
      const durMatch = (log.activity_duration ?? '').match(/(\d+)/)
      if (durMatch) totalMin += parseInt(durMatch[1], 10)
      if (log.rating === 1) liked.push(log.activity_name)
      if (log.rating === -1) disliked.push(log.activity_name)
    }

    const catLabels: Record<string, string> = {
      physical: '신체', sensory: '감각', language: '언어',
      cognitive: '인지', emotional: '정서', other: '기타',
    }

    const catSummary = Object.entries(catCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, count]) => `${catLabels[cat] ?? cat} ${count}개`)
      .join(', ')

    const activityList = meaningful
      .map(l => `${l.activity_name}(${l.activity_duration ?? '?'})`)
      .join(', ')

    // 4. GPT로 한줄 요약 생성
    const prompt = `당신은 아기 발달 전문가입니다. 아래 정보를 바탕으로 ${babyName}의 하루를 따뜻하고 짧은 한국어 한 문장(30자 이내)으로 요약해주세요. 감정적이고 일기장 느낌으로 써주세요.

날짜: ${date}
활동 목록: ${activityList}
카테고리 분포: ${catSummary}
총 활동 시간: ${totalMin}분
좋아한 활동: ${liked.length > 0 ? liked.join(', ') : '없음'}
싫어한 활동: ${disliked.length > 0 ? disliked.join(', ') : '없음'}

한 문장만 출력하세요. 따옴표 없이 출력하세요.`

    const response = await getClient().chat.completions.create({
      model: 'gpt-5.4-nano',
      max_completion_tokens: 80,
      messages: [
        { role: 'system', content: prompt },
      ],
    })

    const summary = (response.choices[0]?.message?.content ?? '').trim()

    if (!summary) {
      return NextResponse.json({ summary: null, cached: false, reason: 'generation_failed' })
    }

    // 5. DB에 저장
    await supabase
      .from('daily_summaries')
      .upsert({
        profile_id: profileId,
        summary_date: date,
        summary,
      }, { onConflict: 'profile_id,summary_date' })

    return NextResponse.json({ summary, cached: false })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Daily summary error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
