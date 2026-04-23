import { Routine } from '@/lib/supabase/types'

export interface AppliedRoutine {
  label: string
  description: string | null
  durationMinutes: number
  placement: 'start' | 'end'  // where inside the window the routine sits
  overlapMinutes: number      // how much of the window the routine covers
}

interface ApplyContext {
  windowIndex: number
  totalWindows: number
  windowStartTime: string | null  // "HH:MM" or null
  windowDurationMinutes: number
}

function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export function applyRoutines(
  routines: Routine[],
  ctx: ApplyContext
): AppliedRoutine[] {
  const applied: AppliedRoutine[] = []
  const { windowIndex, totalWindows, windowStartTime, windowDurationMinutes } = ctx

  for (const r of routines) {
    if (!r.enabled) continue

    if (r.kind === 'window_position') {
      const isFirst = windowIndex === 0
      const isLast = windowIndex === totalWindows - 1
      const matchAnchor =
        (r.window_anchor === 'first' && isFirst) ||
        (r.window_anchor === 'last' && isLast)
      if (!matchAnchor) continue
      if (!r.position) continue

      const overlap = Math.min(r.duration_minutes, windowDurationMinutes)
      applied.push({
        label: r.label,
        description: r.description,
        durationMinutes: r.duration_minutes,
        placement: r.position,
        overlapMinutes: overlap,
      })
      continue
    }

    if (r.kind === 'time_of_day' && r.start_time && windowStartTime) {
      const routineStart = toMinutes(r.start_time)
      const routineEnd = routineStart + r.duration_minutes
      const windowStart = toMinutes(windowStartTime)
      const windowEnd = windowStart + windowDurationMinutes

      const overlapStart = Math.max(routineStart, windowStart)
      const overlapEnd = Math.min(routineEnd, windowEnd)
      const overlap = overlapEnd - overlapStart

      if (overlap <= 0) continue

      // Determine placement: closer to window start or end?
      const midWindow = (windowStart + windowEnd) / 2
      const midRoutine = (Math.max(routineStart, windowStart) + Math.min(routineEnd, windowEnd)) / 2
      const placement: 'start' | 'end' = midRoutine < midWindow ? 'start' : 'end'

      applied.push({
        label: r.label,
        description: r.description,
        durationMinutes: r.duration_minutes,
        placement,
        overlapMinutes: overlap,
      })
    }
  }

  return applied
}

export function describeRoutineForPrompt(r: AppliedRoutine): string {
  const placement = r.placement === 'start' ? '깨시 시작 부분' : '깨시 끝 부분'
  const desc = r.description ? ` (${r.description})` : ''
  return `- ${r.label}: ${placement}에 ${r.overlapMinutes}분 배치${desc}`
}
