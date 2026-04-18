'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { WakeWindow } from '@/lib/supabase/types'

export function useWakeWindows(profileId: string | undefined) {
  const [wakeWindows, setWakeWindows] = useState<WakeWindow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profileId) {
      setLoading(false)
      return
    }
    const supabase = createClient()
    supabase
      .from('wake_windows')
      .select('*')
      .eq('profile_id', profileId)
      .order('window_index')
      .then(({ data }) => {
        setWakeWindows(data ?? [])
        setLoading(false)
      })
  }, [profileId])

  return { wakeWindows, loading }
}
