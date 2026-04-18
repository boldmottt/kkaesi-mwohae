import { getAgeInMonths, getAgeLabel } from '@/lib/utils/age'

describe('getAgeInMonths', () => {
  it('3개월 아기를 정확히 계산한다', () => {
    const birthDate = new Date('2026-01-18')
    const today = new Date('2026-04-18')
    expect(getAgeInMonths(birthDate, today)).toBe(3)
  })

  it('0개월(신생아)을 계산한다', () => {
    const birthDate = new Date('2026-04-01')
    const today = new Date('2026-04-18')
    expect(getAgeInMonths(birthDate, today)).toBe(0)
  })

  it('11개월을 계산한다', () => {
    const birthDate = new Date('2025-05-18')
    const today = new Date('2026-04-18')
    expect(getAgeInMonths(birthDate, today)).toBe(11)
  })
})

describe('getAgeLabel', () => {
  it('0개월이면 "신생아 (0개월)"를 반환한다', () => {
    expect(getAgeLabel(0)).toBe('신생아 (0개월)')
  })

  it('3개월이면 "3개월"을 반환한다', () => {
    expect(getAgeLabel(3)).toBe('3개월')
  })
})
