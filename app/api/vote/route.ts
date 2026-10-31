import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { ficheId, fingerprint } = await request.json()

    if (!ficheId || !fingerprint) {
      return NextResponse.json(
        { error: 'ficheId et fingerprint requis' },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    // 1. Vérifie si le couple (ficheId, fingerprint) existe déjà
    const { data: existingVote, error: checkError } = await supabase
      .from('useful_votes')
      .select('id')
      .eq('fiche_id', ficheId)
      .eq('voter_fingerprint', fingerprint)
      .maybeSingle()

    if (checkError) {
      console.error('Erreur vérification vote:', checkError)
    }

    if (existingVote) {
      return NextResponse.json({ error: 'Déjà voté' }, { status: 400 })
    }

    // 2. Insère le vote dans useful_votes
    const { error: insertError } = await supabase
      .from('useful_votes')
      .insert({ fiche_id: ficheId, voter_fingerprint: fingerprint })

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Déjà voté' }, { status: 400 })
      }
      throw insertError
    }

    // 3. Incrémente useful_count dans fiches
    const { count } = await supabase
      .from('useful_votes')
      .select('*', { count: 'exact', head: true })
      .eq('fiche_id', ficheId)

    const updatedUsefulCount = count ?? 1

    await supabase
      .from('fiches')
      .update({ useful_count: updatedUsefulCount })
      .eq('id', ficheId)

    return NextResponse.json({
      success: true,
      useful_count: updatedUsefulCount,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    console.error('Erreur /api/vote:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
