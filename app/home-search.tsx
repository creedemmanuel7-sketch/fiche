'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
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
  user: { email?: string } | null
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
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] p-6 sm:p-12">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Barre supérieure avec navigation */}
        <header className="flex items-center justify-between pb-6 border-b border-[#E5E5E5]">
          <Link href="/" className="text-xl font-bold tracking-tight text-[#1A1A1A]">
            Fiche
          </Link>
          <nav>
            {user ? (
              <Link
                href="/dashboard"
                className="border border-[#E5E5E5] bg-white text-[#1A1A1A] hover:bg-gray-50 px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Se connecter
              </Link>
            )}
          </nav>
        </header>

        {/* En-tête héro */}
        <div className="text-center space-y-3 pt-4">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A1A]">
            Fiche
          </h1>
          <p className="text-base text-gray-500 max-w-lg mx-auto">
            Le savoir technique de la communauté, capitalisé.
          </p>
        </div>

        {/* Barre de recherche centrale */}
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Rechercher une fiche par mot-clé (ex: react, css, git)..."
            className="w-full border border-[#E5E5E5] p-3.5 pl-4 rounded bg-white text-[#1A1A1A] placeholder-gray-400 focus:outline-none focus:border-black text-sm shadow-sm"
          />
          {isPending && (
            <span className="absolute right-4 top-3.5 text-xs text-gray-400">
              Recherche...
            </span>
          )}
        </div>

        {/* Liste des fiches */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wider text-gray-400">
              {query.trim() ? 'Résultats de recherche' : 'Dernières fiches publiées'}
            </h2>
            <span className="text-xs text-gray-400">
              {fiches.length} fiche{fiches.length > 1 ? 's' : ''}
            </span>
          </div>

          {fiches.length === 0 ? (
            <div className="bg-white border border-[#E5E5E5] rounded p-12 text-center">
              <p className="text-gray-500 text-sm">Aucune fiche trouvée.</p>
            </div>
          ) : (
            <div className="grid gap-3">
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
                    className="block bg-white border border-[#E5E5E5] hover:border-black rounded p-5 space-y-3 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-semibold text-base text-[#1A1A1A] group-hover:text-black leading-snug">
                        {fiche.title}
                      </h3>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {dateFormatted}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F5F5F5] text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {fiche.tags &&
                          fiche.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        {fiche.stack &&
                          fiche.stack.map((item, idx) => (
                            <span
                              key={`stack-${idx}`}
                              className="border border-[#E5E5E5] text-gray-500 px-2 py-0.5 rounded text-xs"
                            >
                              {item}
                            </span>
                          ))}
                      </div>

                      <div className="flex items-center gap-3 text-gray-400 font-mono text-[11px]">
                        <span>Auteur : {fiche.author_name || 'Senior'}</span>
                        <span>•</span>
                        <span>{fiche.useful_count || 0} utile</span>
                        <span>•</span>
                        <span>{fiche.view_count || 0} vue{fiche.view_count > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
