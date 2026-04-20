import { formatDuration, formatTimeRange, parseTimeString } from '@/lib/utils/time'

describe('formatDuration', () => {
  it('30분을 "30분"으로 포맷한다', () => {
    expect(formatDuration(30)).toBe('30분')
  })

  it('90분을 "1시간 30분"으로 포맷한다', () => {
    expect(formatDuration(90)).toBe('1시간 30분')
  })

  it('60분을 "1시간"으로 포맷한다', () => {
    expect(formatDuration(60)).toBe('1시간')
  })

  it('180분을 "3시간"으로 포맷한다', () => {
    expect(formatDuration(180)).toBe('3시간')
  })
})

describe('formatTimeRange', () => {
  it('시작 시간과 분을 더해 범위 문자열을 반환한다', () => {
    expect(formatTimeRange('09:00', 90)).toBe('오전 9:00~오전 10:30')
  })

  it('오후 시간을 올바르게 처리한다', () => {
    expect(formatTimeRange('13:00', 60)).toBe('오후 1:00~오후 2:00')
  })

  it('오전에서 오후로 넘어가는 경우를 올바르게 처리한다', () => {
    expect(formatTimeRange('11:00', 180)).toBe('오전 11:00~오후 2:00')
  })
})

describe('parseTimeString', () => {
  it('"09:00"을 {hours: 9, minutes: 0}으로 파싱한다', () => {
    expect(parseTimeString('09:00')).toEqual({ hours: 9, minutes: 0 })
  })
})
