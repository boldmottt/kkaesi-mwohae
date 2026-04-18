export function getAgeInMonths(birthDate: Date, today: Date = new Date()): number {
  const years = today.getFullYear() - birthDate.getFullYear()
  const months = today.getMonth() - birthDate.getMonth()
  return years * 12 + months
}

export function getAgeLabel(ageMonths: number): string {
  if (ageMonths === 0) return '신생아 (0개월)'
  return `${ageMonths}개월`
}
