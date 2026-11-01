import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import FicheViewer from './fiche-viewer'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: fiche } = await supabase
    .from('fiches')
    .select('title, problem, tags, author_id')
    .eq('id', id)
    .maybeSingle()

  if (!fiche) {
    return {
      title: 'Fiche introuvable | Fiche',
    }
  }

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

  const rawProblem = fiche.problem || ''
  const description =
    rawProblem.length > 150 ? `${rawProblem.slice(0, 147)}...` : rawProblem

  const tagsParam = (fiche.tags || []).join(',')
  const ogImageUrl = `/api/og?title=${encodeURIComponent(fiche.title)}&author=${encodeURIComponent(authorName)}&tags=${encodeURIComponent(tagsParam)}`

  return {
    title: `${fiche.title} | Fiche`,
    description,
    openGraph: {
      title: fiche.title,
      description,
      type: 'article',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: fiche.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fiche.title,
      description,
      images: [ogImageUrl],
    },
  }
}

async function FicheContent({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Utilisateur connecté éventuel
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let fiche = null
  const { data: withCat, error: catError } = await supabase
    .from('fiches')
    .select(
      'id, title, problem, solution, original_question, tags, stack, view_count, useful_count, created_at, author_id, category'
    )
    .eq('id', id)
    .maybeSingle()

  if (!catError && withCat) {
    fiche = withCat
  } else {
    const { data: fallbackFiche, error: fallbackError } = await supabase
      .from('fiches')
      .select(
        'id, title, problem, solution, original_question, tags, stack, view_count, useful_count, created_at, author_id'
      )
      .eq('id', id)
      .maybeSingle()

    if (fallbackError || !fallbackFiche) {
      notFound()
    }
    fiche = fallbackFiche
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
      user={user ? { email: user.email } : null}
    />
  )
}

export default function FichePage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-sm text-muted">Chargement de la fiche...</p>
        </div>
      }
    >
      <FicheContent params={params} />
    </Suspense>
  )
}
