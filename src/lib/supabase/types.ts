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
  updated_at: string
}

export interface ActivityCache {
  id: string
  profile_id: string
  cache_date: string
  window_index: number
  activities: Activity[]
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
