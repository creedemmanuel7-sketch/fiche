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

    // 1. Insère la vue
    const { error: insertError } = await supabase
      .from('views')
      .insert({ fiche_id: ficheId, viewer_fingerprint: fingerprint })

    if (insertError) {
      console.error('Erreur insertion view:', insertError)
      throw insertError
    }

    // 2. Incrémente view_count dans fiches
    const { count } = await supabase
      .from('views')
      .select('*', { count: 'exact', head: true })
      .eq('fiche_id', ficheId)

    const updatedViewCount = count ?? 1

    await supabase
      .from('fiches')
      .update({ view_count: updatedViewCount })
      .eq('id', ficheId)

    return NextResponse.json({
      success: true,
      view_count: updatedViewCount,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    console.error('Erreur /api/view:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
