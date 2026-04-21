export interface Activity {
  name: string
  duration: string
  effect: string
}

export interface Profile {
  id: string
  owner_user_id: string
  baby_name: string
  birth_date: string
  notes: string | null
  created_at: string
}

export interface WakeWindow {
  id: string
  profile_id: string
  window_index: number
  duration_minutes: number
  start_time: string | null
  routines: string | null
  updated_at: string
}

export interface ActivityCache {
  id: string
  profile_id: string
  cache_date: string
  window_index: number
  activities: Activity[]
  duration_minutes: number | null
  routines: string | null
  created_at: string
}

export interface Invitation {
  id: string
  profile_id: string
  token: string
  accepted_at: string | null
  created_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  type: 'answer' | 'update'
  content: string
  activities?: Activity[]
}

export interface ActivityLog {
  id: string
  profile_id: string
  log_date: string
  window_index: number
  activity_name: string
  activity_duration: string | null
  activity_effect: string | null
  did: boolean
  rating: -1 | 0 | 1
  note: string | null
  created_at: string
  updated_at: string
}

export type RoutineKind = 'time_of_day' | 'window_position'
export type RoutineAnchor = 'first' | 'last'
export type RoutinePosition = 'start' | 'end'

export interface Routine {
  id: string
  profile_id: string
  label: string
  description: string | null
  duration_minutes: number
  kind: RoutineKind
  start_time: string | null
  window_anchor: RoutineAnchor | null
  position: RoutinePosition | null
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface DailyChatSession {
  id: string
  profile_id: string
  chat_date: string
  messages: ChatMessage[]
  context_summary: string | null
  schedule_applied: boolean
  created_at: string
  updated_at: string
}

export interface DailyRoutineStatus {
  id: string
  profile_id: string
  status_date: string
  window_index: number
  routine_text: string
  skipped: boolean
  created_at: string
}
