'use client'

interface DateTab {
  date: string    // "YYYY-MM-DD"
  label: string   // "4/19 (일)"
}

interface Props {
  selectedDate: string
  onSelect: (date: string) => void
}

function getNextSixDays(): DateTab[] {
  const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
  const tabs: DateTab[] = []

  for (let i = 1; i <= 6; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const label = `${d.getMonth() + 1}/${d.getDate()} (${DAY_LABELS[d.getDay()]})`
    tabs.push({ date: dateStr, label })
  }

  return tabs
}

export function WeekTabs({ selectedDate, onSelect }: Props) {
  const tabs = getNextSixDays()

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
      {tabs.map(({ date, label }) => (
        <button
          key={date}
          onClick={() => onSelect(date)}
          className={`shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            selectedDate === date
              ? 'bg-amber-400 text-white'
              : 'bg-white text-gray-600'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
