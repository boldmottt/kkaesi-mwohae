export function getAgeInMonths(birthDate: Date, today: Date = new Date()): number {
  const years = today.getFullYear() - birthDate.getFullYear()
  const months = today.getMonth() - birthDate.getMonth()
  const dayAdjust = today.getDate() < birthDate.getDate() ? -1 : 0
  return years * 12 + months + dayAdjust
}

export function getAgeInDays(birthDate: Date, today: Date = new Date()): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24
  const b = Date.UTC(birthDate.getFullYear(), birthDate.getMonth(), birthDate.getDate())
  const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.max(0, Math.floor((t - b) / MS_PER_DAY))
}

export function getAgeLabel(ageMonths: number): string {
  if (ageMonths === 0) return '신생아 (0개월)'
  return `${ageMonths}개월`
}
