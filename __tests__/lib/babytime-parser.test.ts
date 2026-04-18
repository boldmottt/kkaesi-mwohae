import { parseBabyTimeCsv } from '@/lib/babytime/parser'

const csvSample = `날짜,수면 시작,수면 종료,수유 시작,수유 종료
2026-04-10,09:00,09:45,10:00,10:15
2026-04-10,11:30,13:00,13:15,13:30
2026-04-10,15:00,16:30,16:45,17:00
2026-04-11,08:30,09:00,09:10,09:25
2026-04-11,11:00,12:30,12:40,12:55
2026-04-11,14:30,16:00,16:10,16:25`

describe('parseBabyTimeCsv', () => {
  it('수면 기록을 파싱한다', () => {
    const result = parseBabyTimeCsv(csvSample)
    expect(result.sleepRecords).toHaveLength(6)
    expect(result.sleepRecords[0]).toEqual({
      date: '2026-04-10',
      startTime: '09:00',
      endTime: '09:45',
      durationMinutes: 45,
    })
  })

  it('날짜별 평균 깨시 횟수를 계산한다', () => {
    const result = parseBabyTimeCsv(csvSample)
    // 2 days × 3 sleep records each = avg 3
    expect(result.avgWakeWindowCount).toBe(3)
  })

  it('빈 CSV를 처리한다', () => {
    const result = parseBabyTimeCsv('날짜,수면 시작,수면 종료\n')
    expect(result.sleepRecords).toHaveLength(0)
    expect(result.avgWakeWindowCount).toBe(0)
  })
})
