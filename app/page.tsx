import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import HomeLanding from './home-landing'
import { type PublicFiche } from '@/components/FicheCard'

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
      // Pas de blocage si les colonnes ne sont pas encore migrées
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

  // 2. Récupérer les fiches publiques (limitées à 6 pour l'accueil, avec optionnel fetch de recommandées)
  let fichesData: PublicFiche[] = []
  let allFichesForRec: PublicFiche[] = []

  // Essai de lecture avec category et is_hidden
  let fetched: unknown = null
  const { data: withCat, error: catErr } = await supabase
    .from('fiches')
    .select('id, title, problem, solution, tags, stack, author_id, view_count, useful_count, created_at, category, is_hidden')
    .order('created_at', { ascending: false })
    .limit(30)

  if (!catErr && withCat) {
    fetched = withCat
  } else {
    const { data: withHidden, error: hiddenError } = await supabase
      .from('fiches')
      .select('id, title, problem, solution, tags, stack, author_id, view_count, useful_count, created_at, is_hidden')
      .order('created_at', { ascending: false })
      .limit(30)

    if (!hiddenError && withHidden) {
      fetched = withHidden
    } else {
      const { data: fallbackData } = await supabase
        .from('fiches')
        .select('id, title, problem, solution, tags, stack, author_id, view_count, useful_count, created_at')
        .order('created_at', { ascending: false })
        .limit(30)
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

  allFichesForRec = visibleFiches.map((f) => {
    const prof = profileMap[f.author_id]
    const name = prof?.name || 'Équipe Fiche'
    const linkedin = prof?.linkedin_url || (name === 'Équipe Fiche' ? 'https://www.linkedin.com/company/fiche' : null)
    return {
      ...f,
      author_name: name,
      author_linkedin_url: linkedin,
    }
  })

  fichesData = allFichesForRec.slice(0, 6)

  // Calculer fiches recommandées pour l'accueil si stacks préférées
  let recommendedFiches: PublicFiche[] = []
  if (userProfile?.preferred_stacks && userProfile.preferred_stacks.length > 0) {
    const lowerPrefs = userProfile.preferred_stacks.map((p) => p.toLowerCase())
    recommendedFiches = allFichesForRec
      .filter((fiche) => {
        return (
          fiche.stack?.some((s) => lowerPrefs.includes(s.toLowerCase())) ||
          fiche.tags?.some((t) => lowerPrefs.includes(t.toLowerCase()))
        )
      })
      .slice(0, 3)
  }

  return (
    <HomeLanding
      fiches={fichesData}
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
      recommendedFiches={recommendedFiches}
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
