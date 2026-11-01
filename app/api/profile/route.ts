import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const displayName = typeof body.display_name === 'string' ? body.display_name.trim() : ''
    let linkedinUrl =
      typeof body.linkedin_url === 'string'
        ? body.linkedin_url.trim()
        : typeof body.linkedinUrl === 'string'
        ? body.linkedinUrl.trim()
        : ''

    if (linkedinUrl && !linkedinUrl.startsWith('http://') && !linkedinUrl.startsWith('https://')) {
      linkedinUrl = `https://${linkedinUrl}`
    }

    if (!displayName) {
      return NextResponse.json({ error: 'Le nom affiché ne peut pas être vide' }, { status: 400 })
    }

    if (displayName.length > 50) {
      return NextResponse.json({ error: 'Le nom ne peut pas dépasser 50 caractères' }, { status: 400 })
    }

    const updatePayload: Record<string, unknown> = {
      display_name: displayName,
      linkedin_url: linkedinUrl || null,
    }

    let { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id)

    // Fallback gracieux si la colonne linkedin_url n'existe pas encore en base
    if (error && (error.message?.includes('linkedin_url') || error.code === '42703')) {
      delete updatePayload.linkedin_url
      const retry = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id)
      error = retry.error
    }

    if (error) {
      console.error('Erreur mise à jour profil:', error)
      return NextResponse.json({ error: 'Échec de la mise à jour' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      display_name: displayName,
      linkedin_url: linkedinUrl || null,
    })
  } catch (err) {
    console.error('Erreur API profil:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
