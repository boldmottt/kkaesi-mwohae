import { Activity } from '@/lib/supabase/types'

interface Props {
  activities: Activity[]
  loading: boolean
}

export function ActivityList({ activities, loading }: Props) {
  if (loading) {
    return (
      <div data-testid="activity-skeleton" className="flex flex-col gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-amber-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <ol className="flex flex-col gap-3">
      {activities.map((activity, index) => (
        <li key={index} className="flex gap-3 items-start">
          <span className="text-amber-500 font-bold text-lg w-6 shrink-0">
            {index + 1}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{activity.name}</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {activity.duration}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{activity.effect}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
