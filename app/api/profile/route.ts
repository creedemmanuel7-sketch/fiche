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

    if (!displayName) {
      return NextResponse.json({ error: 'Le nom affiché ne peut pas être vide' }, { status: 400 })
    }

    if (displayName.length > 50) {
      return NextResponse.json({ error: 'Le nom ne peut pas dépasser 50 caractères' }, { status: 400 })
    }

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', user.id)

    if (error) {
      console.error('Erreur mise à jour profil:', error)
      return NextResponse.json({ error: 'Échec de la mise à jour' }, { status: 500 })
    }

    return NextResponse.json({ success: true, display_name: displayName })
  } catch (err) {
    console.error('Erreur API profil:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
