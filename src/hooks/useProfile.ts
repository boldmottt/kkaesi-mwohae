'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/supabase/types'

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLoading(false)
        return
      }
      supabase
        .from('profiles')
        .select('*')
        .eq('owner_user_id', user.id)
        .limit(1)
        .single()
        .then(({ data }) => {
          setProfile(data)
          setLoading(false)
        })
    })
  }, [])

  return { profile, loading }
}
