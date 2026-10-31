import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { resend } from '@/lib/resend'
import DigestEmail from '@/emails/digest'

export async function GET(request: Request) {
  // 1. Vérification de la sécurité (CRON_SECRET)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getAdminClient()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // 2. Récupère tous les auteurs ayant au moins une fiche
    const { data: fichesList, error: fichesError } = await supabase
      .from('fiches')
      .select('id, title, author_id, view_count, useful_count')

    if (fichesError) throw fichesError
    if (!fichesList || fichesList.length === 0) {
      return NextResponse.json({ success: true, emailsSent: 0, message: 'Aucune fiche existante' })
    }

    const authorIds = Array.from(new Set(fichesList.map((f) => f.author_id)))

    // 3. Récupère les profils des auteurs
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .in('id', authorIds)

    if (profilesError) throw profilesError

    let emailsSent = 0

    // 4. Traitement pour chaque auteur
    for (const profile of profiles || []) {
      if (!profile.email) continue

      const authorFiches = fichesList.filter((f) => f.author_id === profile.id)
      const ficheIds = authorFiches.map((f) => f.id)

      if (ficheIds.length === 0) continue

      // Stats sur les 30 derniers jours (tables views et useful_votes)
      const { data: recentViews } = await supabase
        .from('views')
        .select('id, fiche_id, created_at')
        .in('fiche_id', ficheIds)
        .gte('created_at', thirtyDaysAgo)

      const { data: recentVotes } = await supabase
        .from('useful_votes')
        .select('id, fiche_id, created_at')
        .in('fiche_id', ficheIds)
        .gte('created_at', thirtyDaysAgo)

      const viewsThisMonth = recentViews ? recentViews.length : 0
      const usefulThisMonth = recentVotes ? recentVotes.length : 0

      // Si l'utilisateur a eu au moins 1 vue ce mois-ci, envoi de l'email
      if (viewsThisMonth >= 1) {
        // Calculer les fiches les plus consultées ce mois-ci
        const viewsPerFiche: Record<string, number> = {}
        const votesPerFiche: Record<string, number> = {}

        for (const v of recentViews || []) {
          viewsPerFiche[v.fiche_id] = (viewsPerFiche[v.fiche_id] || 0) + 1
        }
        for (const v of recentVotes || []) {
          votesPerFiche[v.fiche_id] = (votesPerFiche[v.fiche_id] || 0) + 1
        }

        const topFiches = authorFiches
          .map((f) => ({
            id: f.id,
            title: f.title,
            views: viewsPerFiche[f.id] || 0,
            useful: votesPerFiche[f.id] || 0,
          }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 3)

        const authorName = profile.display_name || profile.email.split('@')[0]

        await resend.client.emails.send({
          from: 'Fiche <onboarding@resend.dev>',
          to: profile.email,
          subject: 'Votre impact sur Fiche ce mois-ci',
          react: DigestEmail({
            authorName,
            viewsThisMonth,
            usefulThisMonth,
            topFiches,
            dashboardUrl: 'https://fiche-pi.vercel.app/dashboard',
          }),
        })

        emailsSent++
      }
    }

    return NextResponse.json({ success: true, emailsSent })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    console.error('Erreur Cron Digest:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
