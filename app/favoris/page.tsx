import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/server'
import FavorisList from './favoris-list'
import type { PublicFiche } from '../home-search'

async function FavorisContent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Récupérer le rôle de l'utilisateur
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const userRole = profile?.role || (user.email?.startsWith('test+') ? 'admin' : 'user')

  let savedFiches: PublicFiche[] = []

  try {
    const { data: savedEntries, error: savedError } = await supabase
      .from('saved_fiches')
      .select('fiche_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!savedError && savedEntries && savedEntries.length > 0) {
      const ficheIds = savedEntries.map((s) => s.fiche_id)
      const { data: fichesData } = await supabase
        .from('fiches')
        .select('id, title, problem, solution, tags, stack, author_id, view_count, useful_count, created_at')
        .in('id', ficheIds)

      if (fichesData) {
        // Préserver l'ordre de sauvegarde
        const fichesMap = new Map(fichesData.map((f) => [f.id, f]))
        savedFiches = ficheIds
          .map((id) => fichesMap.get(id))
          .filter(Boolean) as PublicFiche[]
      }
    }
  } catch (err) {
    console.error('Erreur chargement favoris:', err)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header user={{ email: user.email, role: userRole }} />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Mes fiches favorites
            </h1>
            <p className="text-sm text-muted mt-1">
              Retrouvez rapidement les solutions techniques que vous avez sauvegardées.
            </p>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-accent hover:underline inline-flex items-center gap-1.5"
          >
            ← Explorer d'autres fiches
          </Link>
        </div>

        <FavorisList initialFiches={savedFiches} />
      </main>
    </div>
  )
}

export default function FavorisPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted">
          Chargement de vos favoris...
        </div>
      }
    >
      <FavorisContent />
    </Suspense>
  )
}
