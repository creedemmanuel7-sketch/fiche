import { Suspense } from 'react'
import Header from '@/components/Header'
import { SkeletonGrid } from '@/components/SkeletonCard'
import { createClient } from '@/lib/supabase/server'
import HomeSearch, { type PublicFiche } from '@/app/home-search'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
  const visibleFiches = rawList.filter((f) => !f.is_hidden)

  // Récupérer les noms des auteurs et profils LinkedIn depuis la table profiles
  const authorIds = Array.from(new Set(visibleFiches.map((f) => f.author_id).filter(Boolean)))
  let profileMap: Record<string, { name: string; linkedin_url?: string | null }> = {}
  if (authorIds.length > 0) {
    try {
      const { data: profs, error: pErr } = await supabase
        .from('profiles')
        .select('id, display_name, email, linkedin_url')
        .in('id', authorIds)
      if (!pErr && profs) {
        profs.forEach((p) => {
          profileMap[p.id] = {
            name: p.display_name || (p.email ? p.email.split('@')[0] : 'Équipe Fiche'),
            linkedin_url: (p as { linkedin_url?: string | null }).linkedin_url || null,
          }
        })
      } else {
        const { data: fallbackProfs } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .in('id', authorIds)
        if (fallbackProfs) {
          fallbackProfs.forEach((p) => {
            profileMap[p.id] = {
              name: p.display_name || (p.email ? p.email.split('@')[0] : 'Équipe Fiche'),
            }
          })
        }
      }
    } catch {
      // Ignorer si échec
    }
  }

  fichesData = visibleFiches.map((f) => {
    const prof = profileMap[f.author_id]
    const name = prof?.name || 'Équipe Fiche'
    const linkedin = prof?.linkedin_url || (name === 'Équipe Fiche' ? 'https://www.linkedin.com/company/fiche' : null)
    return {
      ...f,
      author_name: name,
      author_linkedin_url: linkedin,
    }
  })

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
        <div className="min-h-screen bg-background text-foreground flex flex-col">
          <Header user={null} />
          <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-10 space-y-10">
            <div className="space-y-4 max-w-2xl animate-pulse">
              <div className="h-9 w-52 bg-muted/20 dark:bg-muted/30 rounded-md" />
              <div className="h-4 w-80 bg-muted/20 dark:bg-muted/30 rounded" />
            </div>
            <div className="h-12 w-full bg-card border border-border rounded-lg animate-pulse" />
            <section className="space-y-4">
              <div className="h-5 w-36 bg-muted/20 dark:bg-muted/30 rounded animate-pulse" />
              <SkeletonGrid count={6} />
            </section>
          </main>
        </div>
      }
    >
      <ExplorerContent />
    </Suspense>
  )
}
