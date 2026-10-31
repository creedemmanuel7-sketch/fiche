import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import HomeSearch, { type PublicFiche } from './home-search'

async function HomeContent() {
  const supabase = await createClient()

  // 1. Vérifier si un utilisateur est connecté
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 2. Récupérer les 10 dernières fiches
  const { data: fiches, error } = await supabase
    .from('fiches')
    .select('id, title, problem, solution, tags, stack, author_id, view_count, useful_count, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Erreur chargement dernières fiches:', error)
  }

  const initialFiches = (fiches as PublicFiche[]) || []

  return (
    <HomeSearch
      initialFiches={initialFiches}
      user={user ? { email: user.email } : null}
    />
  )
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  )
}
