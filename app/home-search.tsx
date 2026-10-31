'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/client'

export interface PublicFiche {
  id: string
  title: string
  problem?: string
  solution?: string
  tags: string[]
  stack: string[]
  author_id: string
  author_name?: string
  view_count: number
  useful_count: number
  created_at: string
}

interface HomeSearchProps {
  initialFiches: PublicFiche[]
  user: { email?: string | null } | null
}

export default function HomeSearch({ initialFiches, user }: HomeSearchProps) {
  const [query, setQuery] = useState('')
  const [fiches, setFiches] = useState<PublicFiche[]>(initialFiches)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  const handleSearch = async (searchTerm: string) => {
    setQuery(searchTerm)
    const trimmed = searchTerm.trim()

    if (!trimmed) {
      setFiches(initialFiches)
      return
    }

    startTransition(async () => {
      // 1. Essai avec full-text search textSearch / wfts sur french
      const { data: ftsData, error: ftsError } = await supabase
        .from('fiches')
        .select('id, title, problem, solution, tags, stack, author_id, view_count, useful_count, created_at')
        .or(`title.wfts(french).${trimmed},problem.wfts(french).${trimmed},solution.wfts(french).${trimmed}`)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!ftsError && ftsData && ftsData.length > 0) {
        setFiches(ftsData as PublicFiche[])
        return
      }

      // 2. Repli souple ilike pour les correspondances partielles
      const { data: ilikeData } = await supabase
        .from('fiches')
        .select('id, title, problem, solution, tags, stack, author_id, view_count, useful_count, created_at')
        .or(`title.ilike.%${trimmed}%,problem.ilike.%${trimmed}%,solution.ilike.%${trimmed}%`)
        .order('created_at', { ascending: false })
        .limit(10)

      setFiches((ilikeData as PublicFiche[]) || [])
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header user={user} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-10 space-y-10">
        {/* En-tête héro sobre */}
        <div className="text-center space-y-3 pt-6 pb-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Fiche
          </h1>
          <p className="text-base text-muted max-w-lg mx-auto">
            Le savoir technique de la communauté, capitalisé.
          </p>
        </div>

        {/* Barre de recherche centrale */}
        <div className="relative max-w-2xl mx-auto">
          <input
            type="search"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Rechercher une fiche par mot-clé (ex: react, css, tailwind)..."
            className="w-full bg-card border border-border p-3.5 pl-4 rounded-md text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent shadow-sm text-sm transition-all"
          />
          {isPending && (
            <span className="absolute right-4 top-3.5 text-xs text-muted">
              Recherche...
            </span>
          )}
        </div>

        {/* Liste des fiches */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
              {query.trim() ? 'Résultats de recherche' : 'Dernières fiches publiées'}
            </h2>
            <span className="text-xs text-muted">
              {fiches.length} fiche{fiches.length > 1 ? 's' : ''}
            </span>
          </div>

          {fiches.length === 0 ? (
            <div className="bg-card border border-border rounded-md p-12 text-center shadow-sm">
              <p className="text-muted text-sm">Aucune fiche trouvée.</p>
            </div>
          ) : (
            <div className="grid gap-3.5">
              {fiches.map((fiche) => {
                const dateFormatted = new Date(fiche.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })

                return (
                  <Link
                    key={fiche.id}
                    href={`/fiche/${fiche.id}`}
                    className="block bg-card border border-border hover:border-gray-400 dark:hover:border-gray-600 rounded-md p-5 space-y-3 transition-all shadow-sm group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-lg font-semibold text-foreground leading-snug">
                        {fiche.title}
                      </h3>
                      <span className="text-sm text-muted whitespace-nowrap">
                        {dateFormatted}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {fiche.tags &&
                          fiche.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="bg-accent-light text-accent text-xs px-2 py-1 rounded-full font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        {fiche.stack &&
                          fiche.stack.map((item, idx) => (
                            <span
                              key={`stack-${idx}`}
                              className="bg-accent-light text-accent text-xs px-2 py-1 rounded-full font-medium"
                            >
                              {item}
                            </span>
                          ))}
                      </div>

                      <div className="flex items-center gap-3 text-sm text-muted">
                        <span>Auteur : {fiche.author_name || 'Senior'}</span>
                        <span>•</span>
                        <span>👍 {fiche.useful_count || 0} utile</span>
                        <span>•</span>
                        <span>👁 {fiche.view_count || 0} vue{fiche.view_count > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
