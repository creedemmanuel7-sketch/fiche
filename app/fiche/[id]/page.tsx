import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FicheViewer from './fiche-viewer'

interface PageProps {
  params: Promise<{ id: string }>
}

async function FicheContent({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: fiche, error } = await supabase
    .from('fiches')
    .select('id, title, problem, solution, original_question, tags, stack, view_count, useful_count, created_at, author_id')
    .eq('id', id)
    .maybeSingle()

  if (error || !fiche) {
    notFound()
  }

  // Récupérer le nom de l'auteur
  let authorName = 'Senior'
  if (fiche.author_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, display_name')
      .eq('id', fiche.author_id)
      .maybeSingle()

    if (profile?.display_name) {
      authorName = profile.display_name
    } else if (profile?.email) {
      authorName = profile.email.split('@')[0]
    }
  }

  return (
    <FicheViewer
      fiche={{
        ...fiche,
        author_name: authorName,
      }}
    />
  )
}

export default function FichePage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
          <p className="text-sm text-gray-500">Chargement de la fiche...</p>
        </div>
      }
    >
      <FicheContent params={params} />
    </Suspense>
  )
}
