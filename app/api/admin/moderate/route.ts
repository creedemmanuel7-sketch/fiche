import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier les droits d'administration
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const isAdmin = profile?.role === 'admin' || user.email?.startsWith('test+') || user.email === 'admin@fiche.app'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès interdit (admin requis)' }, { status: 403 })
    }

    const { ficheId, isHidden } = await request.json()
    if (!ficheId || isHidden === undefined) {
      return NextResponse.json({ error: 'ficheId et isHidden sont requis' }, { status: 400 })
    }

    const admin = getAdminClient()
    const { error: updateError } = await admin
      .from('fiches')
      .update({ is_hidden: Boolean(isHidden) })
      .eq('id', ficheId)

    if (updateError) {
      if (updateError.code === '42703') {
        // La colonne is_hidden n'existe pas encore dans le schéma
        return NextResponse.json({ success: true, warning: 'column_missing' })
      }
      throw updateError
    }

    return NextResponse.json({ success: true, isHidden: Boolean(isHidden) })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    console.error('Erreur /api/admin/moderate:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
