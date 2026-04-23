import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

let _client: OpenAI | null = null
function getClient(): OpenAI {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _client
}

async function classifyActivity(name: string): Promise<string> {
  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-5.4-nano',
      max_completion_tokens: 20,
      messages: [
        {
          role: 'system',
          content: '영아 활동을 분류합니다. 반드시 다음 중 하나만 출력하세요: physical, sensory, language, cognitive, emotional\n\n- physical: 터미타임, 뒤집기, 기기, 걸음마, 산책, 발차기, 수영, 체조 등 신체 운동\n- sensory: 촉감놀이, 물놀이, 거울, 딸랑이, 모빌, 음악감상, 목욕놀이 등 감각 자극\n- language: 노래, 그림책, 말걸기, 옹알이, 손유희, 동요 등 언어\n- cognitive: 까꿍, 블록, 숨긴물건찾기, 퍼즐, 모방놀이, 컵쌓기 등 인지\n- emotional: 마사지, 안아주기, 스킨십, 눈맞춤, 자장가, 애착놀이 등 정서\n\n한 단어만 출력하세요.',
        },
        { role: 'user', content: name },
      ],
    })
    const text = (response.choices[0]?.message?.content ?? 'other').trim().toLowerCase()
    const valid = ['physical', 'sensory', 'language', 'cognitive', 'emotional']
    return valid.includes(text) ? text : 'other'
  } catch {
    return 'other'
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // category가 'other'이거나 null인 로그 조회
    const { data: logs, error } = await supabase
      .from('activity_logs')
      .select('id, activity_name, category')
      .or('category.eq.other,category.is.null')
      .limit(1000)

    if (error) throw error
    if (!logs || logs.length === 0) {
      return NextResponse.json({ message: 'No logs to migrate', updated: 0 })
    }

    // 같은 이름은 한 번만 분류 (캐싱)
    const nameCache = new Map<string, string>()
    let updated = 0
    let skipped = 0

    for (const log of logs) {
      const name = log.activity_name
      if (!name) continue

      // 고정 루틴(📌)은 other 유지
      if (name.startsWith('📌')) {
        skipped++
        continue
      }

      let category = nameCache.get(name)
      if (!category) {
        category = await classifyActivity(name)
        nameCache.set(name, category)
      }

      if (category !== 'other') {
        const { error: updateError } = await supabase
          .from('activity_logs')
          .update({ category })
          .eq('id', log.id)

        if (!updateError) updated++
      } else {
        skipped++
      }
    }

    // custom_activity_tags도 재분류
    const { data: tags, error: tagError } = await supabase
      .from('custom_activity_tags')
      .select('id, label, category')
      .or('category.eq.other,category.is.null')

    let tagsUpdated = 0
    if (!tagError && tags) {
      for (const tag of tags) {
        let category = nameCache.get(tag.label)
        if (!category) {
          category = await classifyActivity(tag.label)
          nameCache.set(tag.label, category)
        }
        if (category !== 'other') {
          const { error: updateError } = await supabase
            .from('custom_activity_tags')
            .update({ category })
            .eq('id', tag.id)
          if (!updateError) tagsUpdated++
        }
      }
    }

    return NextResponse.json({
      message: 'Migration complete',
      totalLogs: logs.length,
      updated,
      skipped,
      uniqueNames: nameCache.size,
      classifications: Object.fromEntries(nameCache),
      tagsUpdated,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Category migration error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
