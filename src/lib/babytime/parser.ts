interface SleepRecord {
  date: string
  startTime: string
  endTime: string
  durationMinutes: number
}

export interface ParseResult {
  sleepRecords: SleepRecord[]
  avgWakeWindowCount: number
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function parseBabyTimeCsv(csvContent: string): ParseResult {
  const lines = csvContent.trim().split('\n')
  const dataLines = lines.slice(1).filter(l => l.trim())

  const sleepRecords: SleepRecord[] = dataLines
    .map(line => {
      const cols = line.split(',')
      if (!cols[1]?.trim() || !cols[2]?.trim()) return null
      const startTime = cols[1].trim()
      const endTime = cols[2].trim()
      const durationMinutes = timeToMinutes(endTime) - timeToMinutes(startTime)
      if (durationMinutes <= 0) return null
      return { date: cols[0].trim(), startTime, endTime, durationMinutes }
    })
    .filter((r): r is SleepRecord => r !== null)

  if (sleepRecords.length === 0) {
    return { sleepRecords: [], avgWakeWindowCount: 0 }
  }

  const byDate = sleepRecords.reduce((acc, r) => {
    acc[r.date] = (acc[r.date] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const counts = Object.values(byDate)
  const avgWakeWindowCount = Math.round(
    counts.reduce((a, b) => a + b, 0) / counts.length
  )

  return { sleepRecords, avgWakeWindowCount }
}
