export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}분`
  if (mins === 0) return `${hours}시간`
  return `${hours}시간 ${mins}분`
}

export function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return { hours, minutes }
}

export function formatPeriodTime(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60) % 24
  const mins = totalMinutes % 60
  const period = hours24 < 12 ? '오전' : '오후'
  const displayHour = hours24 % 12 || 12
  const displayMin = String(mins).padStart(2, '0')
  return `${period} ${displayHour}:${displayMin}`
}

export function formatTimeRange(startTime: string, durationMinutes: number): string {
  const { hours, minutes } = parseTimeString(startTime)
  const totalStartMins = hours * 60 + minutes
  const totalEndMins = totalStartMins + durationMinutes
  return `${formatPeriodTime(totalStartMins)}~${formatPeriodTime(totalEndMins)}`
}
