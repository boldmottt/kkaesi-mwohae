import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const profileId = searchParams.get('profileId')

    if (!profileId) {
      return NextResponse.json({ error: 'profileId required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('custom_activity_tags')
      .select('*')
      .eq('profile_id', profileId)
      .order('use_count', { ascending: false })
      .order('last_used_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ tags: data ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Custom tags GET error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { profileId, label, category } = await req.json()

    if (!profileId || !label?.trim()) {
      return NextResponse.json({ error: 'profileId and label required' }, { status: 400 })
    }

    const trimmedLabel = label.trim()

    const { data: existing } = await supabase
      .from('custom_activity_tags')
      .select('id, use_count')
      .eq('profile_id', profileId)
      .eq('label', trimmedLabel)
      .maybeSingle()

    if (existing) {
      const { data, error } = await supabase
        .from('custom_activity_tags')
        .update({
          use_count: existing.use_count + 1,
          last_used_at: new Date().toISOString(),
          ...(category ? { category } : {}),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ tag: data })
    } else {
      const { data, error } = await supabase
        .from('custom_activity_tags')
        .insert({
          profile_id: profileId,
          label: trimmedLabel,
          use_count: 1,
          last_used_at: new Date().toISOString(),
          category: (category as string) ?? 'other',
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ tag: data })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Custom tags POST error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await supabase
      .from('custom_activity_tags')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Custom tags DELETE error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
