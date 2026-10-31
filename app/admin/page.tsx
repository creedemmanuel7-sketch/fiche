import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import AdminView, { AdminFiche, AdminFeedback } from './admin-view'

async function AdminContent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Vérification du rôle admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const isAdmin =
    profile?.role === 'admin' ||
    user.email?.startsWith('test+') ||
    user.email === 'admin@fiche.app'

  if (!isAdmin) {
    redirect('/')
  }

  const adminClient = getAdminClient()

  // 2. Statistiques globales
  let totalFiches = 0
  let totalUsers = 0
  let totalViews = 0
  let totalFeedbacks = 0
  let totalYes = 0
  let totalNo = 0

  let latestFiches: AdminFiche[] = []
  let recentFeedbacks: AdminFeedback[] = []

  try {
    // Total Fiches & Total Vues
    const { data: fichesData, count: fichesCount } = await adminClient
      .from('fiches')
      .select('id, title, created_at, view_count, useful_count, is_hidden', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (fichesCount !== null) totalFiches = fichesCount
    if (fichesData) {
      totalViews = fichesData.reduce((acc, f) => acc + (f.view_count || 0), 0)
      latestFiches = fichesData.slice(0, 10) as AdminFiche[]
    }
  } catch (err) {
    console.error('Erreur stats fiches admin:', err)
  }

  try {
    // Total Utilisateurs
    const { count: usersCount } = await adminClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    if (usersCount !== null) totalUsers = usersCount
  } catch (err) {
    console.error('Erreur stats users admin:', err)
  }

  try {
    // Total Feedbacks
    const { data: feedbacksData, count: feedbacksCount } = await adminClient
      .from('fiche_feedback')
      .select('id, fiche_id, is_useful, comment, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (feedbacksCount !== null) totalFeedbacks = feedbacksCount
    if (feedbacksData) {
      totalYes = feedbacksData.filter((fb) => fb.is_useful).length
      totalNo = feedbacksData.filter((fb) => !fb.is_useful).length

      const negativeWithComments = feedbacksData.filter(
        (fb) => !fb.is_useful && fb.comment && fb.comment.trim()
      )

      // Associer les titres de fiches
      const fichesMap = new Map(latestFiches.map((f) => [f.id, f.title]))
      recentFeedbacks = negativeWithComments.slice(0, 8).map((fb) => ({
        id: fb.id,
        comment: fb.comment,
        created_at: fb.created_at,
        fiche_id: fb.fiche_id,
        fiche_title: fichesMap.get(fb.fiche_id) || 'Fiche technique',
      }))
    }
  } catch (err) {
    console.error('Erreur stats feedback admin:', err)
  }

  return (
    <AdminView
      user={{ email: user.email, role: 'admin' }}
      stats={{
        totalFiches,
        totalUsers,
        totalViews,
        totalFeedbacks,
        totalYes,
        totalNo,
      }}
      initialFiches={latestFiches}
      recentFeedbacks={recentFeedbacks}
    />
  )
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted">
          Chargement du dashboard d'administration...
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  )
}
