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

export function formatTimeRange(startTime: string, durationMinutes: number): string {
  const { hours, minutes } = parseTimeString(startTime)
  const totalStartMins = hours * 60 + minutes
  const totalEndMins = totalStartMins + durationMinutes

  const endHours = Math.floor(totalEndMins / 60) % 24
  const endMins = totalEndMins % 60

  const period = hours < 12 ? '오전' : '오후'
  const displayStartHour = hours % 12 || 12
  const displayStartMin = minutes === 0 ? '00' : String(minutes).padStart(2, '0')

  const displayEndHour = endHours % 12 || 12
  const displayEndMin = endMins === 0 ? '00' : String(endMins).padStart(2, '0')

  return `${period} ${displayStartHour}:${displayStartMin}~${displayEndHour}:${displayEndMin}`
}
