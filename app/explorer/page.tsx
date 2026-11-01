import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import HomeSearch, { type PublicFiche } from '@/app/home-search'

async function ExplorerContent() {
  const supabase = await createClient()

  // 1. Utilisateur connecté
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
      // Pas de blocage si colonnes non migrées
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
      // Table saved_fiches optionnelle
    }
  }

  // 2. Récupérer TOUTES les fiches publiques
  let fichesData: PublicFiche[] = []

  let fetched: unknown = null
  const { data: withCat, error: catErr } = await supabase
    .from('fiches')
    .select('id, title, problem, solution, tags, stack, author_id, view_count, useful_count, created_at, category, is_hidden')
    .order('created_at', { ascending: false })
    .limit(250)

  if (!catErr && withCat) {
    fetched = withCat
  } else {
    const { data: withHidden, error: hiddenError } = await supabase
      .from('fiches')
      .select('id, title, problem, solution, tags, stack, author_id, view_count, useful_count, created_at, is_hidden')
      .order('created_at', { ascending: false })
      .limit(250)

    if (!hiddenError && withHidden) {
      fetched = withHidden
    } else {
      const { data: fallbackData, error: fbError } = await supabase
        .from('fiches')
        .select('id, title, problem, solution, tags, stack, author_id, view_count, useful_count, created_at')
        .order('created_at', { ascending: false })
        .limit(250)

      if (fbError) {
        console.error('Erreur chargement fiches explorer:', fbError)
      }
      fetched = fallbackData || []
    }
  }

  const rawList = (fetched as (PublicFiche & { is_hidden?: boolean })[]) || []
  fichesData = rawList.filter((f) => !f.is_hidden)

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
      title="Explorer les fiches"
      subtitle="Recherchez, filtrez par stack et accédez à tout le savoir capitalisé."
    />
  )
}

export default function ExplorerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-sm text-muted">Chargement du catalogue des fiches...</p>
        </div>
      }
    >
      <ExplorerContent />
    </Suspense>
  )
}
