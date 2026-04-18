import { NextRequest, NextResponse } from 'next/server'
import { parseBabyTimeCsv } from '@/lib/babytime/parser'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const result = parseBabyTimeCsv(text)

    return NextResponse.json({
      avgWakeWindowCount: result.avgWakeWindowCount,
      recordCount: result.sleepRecords.length,
      suggestion: result.avgWakeWindowCount > 0
        ? `BabyTime 기록을 분석했어요. 하루 평균 ${result.avgWakeWindowCount}번의 깨시가 있어요.`
        : '수면 기록을 찾을 수 없어요. CSV 형식을 확인해 주세요.',
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 })
  }
}
