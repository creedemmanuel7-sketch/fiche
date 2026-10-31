import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ficheId = searchParams.get('ficheId')
    const fingerprint = searchParams.get('fingerprint')

    if (!ficheId || !fingerprint) {
      return NextResponse.json({ hasFeedback: false })
    }

    const supabase = getAdminClient()
    const { data, error } = await supabase
      .from('fiche_feedback')
      .select('id')
      .eq('fiche_id', ficheId)
      .eq('voter_fingerprint', fingerprint)
      .maybeSingle()

    if (error) {
      // Table may not exist yet or connection error
      return NextResponse.json({ hasFeedback: false })
    }

    return NextResponse.json({ hasFeedback: Boolean(data) })
  } catch {
    return NextResponse.json({ hasFeedback: false })
  }
}

export async function POST(request: Request) {
  try {
    const { ficheId, isUseful, comment, fingerprint } = await request.json()

    if (!ficheId || isUseful === undefined || !fingerprint) {
      return NextResponse.json(
        { error: 'ficheId, isUseful et fingerprint sont requis' },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    // 1. Vérifie si le couple (fiche_id, voter_fingerprint) existe déjà
    const { data: existingFeedback, error: checkError } = await supabase
      .from('fiche_feedback')
      .select('id')
      .eq('fiche_id', ficheId)
      .eq('voter_fingerprint', fingerprint)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116' && checkError.code !== 'PGRST205') {
      console.error('Erreur vérification feedback:', checkError)
    }

    if (existingFeedback) {
      return NextResponse.json({ error: 'Feedback déjà donné' }, { status: 400 })
    }

    // 2. Insère le feedback
    const { error: insertError } = await supabase
      .from('fiche_feedback')
      .insert({
        fiche_id: ficheId,
        is_useful: Boolean(isUseful),
        comment: comment ? String(comment).trim() : null,
        voter_fingerprint: fingerprint,
      })

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Feedback déjà donné' }, { status: 400 })
      }
      throw insertError
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    console.error('Erreur /api/feedback:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
