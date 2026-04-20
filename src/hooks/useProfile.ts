'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/supabase/types'

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setIsLoggedIn(false)
        setLoading(false)
        return
      }
      setIsLoggedIn(true)
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

  return { profile, loading, isLoggedIn }
}
