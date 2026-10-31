import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ savedFicheIds: [] })
    }

    const { data, error } = await supabase
      .from('saved_fiches')
      .select('fiche_id')
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ savedFicheIds: [] })
    }

    const ids = data ? data.map((item) => item.fiche_id) : []
    return NextResponse.json({ savedFicheIds: ids })
  } catch {
    return NextResponse.json({ savedFicheIds: [] })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Connecte-toi pour sauvegarder' },
        { status: 401 }
      )
    }

    const { ficheId } = await request.json()
    if (!ficheId) {
      return NextResponse.json({ error: 'ficheId requis' }, { status: 400 })
    }

    const admin = getAdminClient()

    // 1. Vérifie si déjà sauvegardé
    const { data: existing, error: checkError } = await admin
      .from('saved_fiches')
      .select('id')
      .eq('user_id', user.id)
      .eq('fiche_id', ficheId)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116' && checkError.code !== 'PGRST205') {
      console.error('Erreur vérification favoris:', checkError)
    }

    if (existing) {
      // Supprime des favoris
      await admin
        .from('saved_fiches')
        .delete()
        .eq('id', existing.id)

      return NextResponse.json({ saved: false, message: 'Fiche retirée des favoris' })
    } else {
      // Ajoute aux favoris
      const { error: insertError } = await admin
        .from('saved_fiches')
        .insert({
          user_id: user.id,
          fiche_id: ficheId,
        })

      if (insertError) {
        if (insertError.code === 'PGRST205') {
          // Table absente avant migration SQL
          return NextResponse.json({ saved: true, warning: 'table_missing' })
        }
        throw insertError
      }

      return NextResponse.json({ saved: true, message: 'Fiche ajoutée aux favoris' })
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    console.error('Erreur /api/favorites:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
