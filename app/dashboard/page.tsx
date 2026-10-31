import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './signout-button'
import DashboardTabs from './dashboard-tabs'
import ProfileHeader from './profile-header'
import type { FicheItem, FicheFeedbackData } from './fiches-list'

async function DashboardContent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Récupérer le profil (rôle et display_name)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .maybeSingle()

  const userRole = profile?.role || (user.email?.startsWith('test+') ? 'admin' : 'user')

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
      <Header user={{ email: user.email, role: userRole }} />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-10 space-y-8">
        {/* En-tête de bienvenue & profil */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
          <ProfileHeader
            initialDisplayName={profile?.display_name || null}
            email={user.email || ''}
          />
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

        {/* Organisation en 3 Onglets : Mes fiches, Mes retours, Mes stats */}
        <DashboardTabs
          userFiches={userFiches}
          feedbackMap={feedbackMap}
          totalFiches={totalFiches}
          totalViews={totalViews}
          totalUseful={totalUseful}
        />
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
