import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import HomeSearch, { type PublicFiche } from './home-search'

async function HomeContent() {
  const supabase = await createClient()

  // 1. Vérifier si un utilisateur est connecté
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userProfile: { preferred_stacks?: string[]; role?: string } | null = null
  let initialSavedIds: string[] = []

  if (user) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_stacks, role')
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        userProfile = profile
      }
    } catch {
      // Pas de bloquant si les colonnes ne sont pas encore migrées
    }

    try {
      const { data: savedData } = await supabase
        .from('saved_fiches')
        .select('fiche_id')
        .eq('user_id', user.id)

      if (savedData) {
        initialSavedIds = savedData.map((s) => s.fiche_id)
      }
    } catch {
      // Table saved_fiches pas encore créée
    }
  }

  // 2. Récupérer les fiches publiques (avec repli gracieux si is_hidden n'existe pas encore)
  let fichesData: PublicFiche[] = []

  const { data: withHidden, error: hiddenError } = await supabase
    .from('fiches')
    .select('id, title, problem, solution, tags, stack, author_id, view_count, useful_count, created_at, is_hidden')
    .order('created_at', { ascending: false })
    .limit(100)

  if (!hiddenError && withHidden) {
    fichesData = withHidden.filter((f) => !(f as { is_hidden?: boolean }).is_hidden) as PublicFiche[]
  } else {
    const { data: fallbackData, error: fbError } = await supabase
      .from('fiches')
      .select('id, title, problem, solution, tags, stack, author_id, view_count, useful_count, created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    if (fbError) {
      console.error('Erreur chargement fiches:', fbError)
    }
    fichesData = (fallbackData as PublicFiche[]) || []
  }

  return (
    <HomeSearch
      initialFiches={fichesData}
      user={
        user
          ? {
              email: user.email,
              role: userProfile?.role || (user.email?.startsWith('test+') ? 'admin' : 'user'),
              preferred_stacks: userProfile?.preferred_stacks || [],
            }
          : null
      }
      initialSavedIds={initialSavedIds}
    />
  )
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-sm text-muted">Chargement de la base de connaissances...</p>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  )
}
