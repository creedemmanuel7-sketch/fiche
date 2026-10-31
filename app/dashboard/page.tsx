import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './signout-button'
import FichesList, { FicheItem, FicheFeedbackData } from './fiches-list'

async function DashboardContent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: fiches, error } = await supabase
    .from('fiches')
    .select('id, title, tags, stack, view_count, useful_count, created_at')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur chargement fiches:', error)
  }

  const userFiches = (fiches as FicheItem[]) || []
  const ficheIds = userFiches.map((f) => f.id)

  const feedbackMap: Record<string, FicheFeedbackData> = {}
  userFiches.forEach((f) => {
    feedbackMap[f.id] = { yesCount: 0, noCount: 0, comments: [] }
  })

  if (ficheIds.length > 0) {
    try {
      const { data: feedbacks, error: fbError } = await supabase
        .from('fiche_feedback')
        .select('id, fiche_id, is_useful, comment, created_at')
        .in('fiche_id', ficheIds)

      if (!fbError && feedbacks) {
        feedbacks.forEach((fb) => {
          if (!feedbackMap[fb.fiche_id]) {
            feedbackMap[fb.fiche_id] = { yesCount: 0, noCount: 0, comments: [] }
          }
          if (fb.is_useful) {
            feedbackMap[fb.fiche_id].yesCount += 1
          } else {
            feedbackMap[fb.fiche_id].noCount += 1
            if (fb.comment && fb.comment.trim()) {
              feedbackMap[fb.fiche_id].comments.push({
                id: fb.id,
                comment: fb.comment.trim(),
                created_at: fb.created_at,
              })
            }
          }
        })
      }
    } catch (e) {
      console.error('Erreur chargement feedback:', e)
    }
  }

  // Calcul des compteurs d'impact agrégés côté serveur
  const totalFiches = userFiches.length
  const totalViews = userFiches.reduce((acc, f) => acc + (f.view_count || 0), 0)
  const totalUseful = userFiches.reduce((acc, f) => acc + (f.useful_count || 0), 0)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header user={user} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-10 space-y-8">
        {/* En-tête de bienvenue & profil */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Tableau de bord</h1>
            <p className="text-sm text-muted mt-1">
              Connecté en tant que <span className="text-foreground font-medium">{user.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/create"
              className="bg-foreground text-background hover:opacity-90 px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm"
            >
              Créer une nouvelle fiche
            </Link>
            <SignOutButton />
          </div>
        </div>

        {/* Section Votre impact */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Votre impact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-md p-5 space-y-1 shadow-sm">
              <span className="text-xs text-muted font-medium uppercase tracking-wider">Fiches publiées</span>
              <p className="text-3xl font-bold tracking-tight text-foreground">{totalFiches}</p>
            </div>
            <div className="bg-card border border-border rounded-md p-5 space-y-1 shadow-sm">
              <span className="text-xs text-muted font-medium uppercase tracking-wider">Vues cumulées</span>
              <p className="text-3xl font-bold tracking-tight text-foreground">{totalViews}</p>
            </div>
            <div className="bg-card border border-border rounded-md p-5 space-y-1 shadow-sm">
              <span className="text-xs text-muted font-medium uppercase tracking-wider">Votes « Utile »</span>
              <p className="text-3xl font-bold tracking-tight text-foreground">{totalUseful}</p>
            </div>
          </div>
        </div>

        {/* Liste des fiches */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Mes fiches</h2>
            <span className="text-xs text-muted">
              {userFiches.length} fiche{userFiches.length > 1 ? 's' : ''}
            </span>
          </div>

          {userFiches.length === 0 ? (
            <div className="bg-card border border-border rounded-md p-10 text-center shadow-sm">
              <p className="text-muted text-sm">Tu n'as pas encore créé de fiche.</p>
            </div>
          ) : (
            <FichesList fiches={userFiches} feedbackMap={feedbackMap} />
          )}
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted">
          Chargement...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
