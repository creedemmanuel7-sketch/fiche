'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { ThumbsUp, Eye, Bookmark, Filter, Sparkles, ArrowUpDown, Check } from 'lucide-react'

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
  user: {
    email?: string | null
    role?: string | null
    preferred_stacks?: string[]
  } | null
  initialSavedIds?: string[]
}

type SortOption = 'recent' | 'useful' | 'views'

export default function HomeSearch({ initialFiches, user, initialSavedIds = [] }: HomeSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStack, setSelectedStack] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [savedIds, setSavedIds] = useState<string[]>(initialSavedIds)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Extraire la liste dynamique des stacks existantes
  const availableStacks = useMemo(() => {
    const stackSet = new Set<string>()
    initialFiches.forEach((f) => {
      f.stack?.forEach((s) => stackSet.add(s.trim()))
      f.tags?.forEach((t) => stackSet.add(t.trim()))
    })
    return Array.from(stackSet).sort((a, b) => a.localeCompare(b))
  }, [initialFiches])

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 2800)
  }

  const handleToggleFavorite = async (e: React.MouseEvent, ficheId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      triggerToast('Connecte-toi pour sauvegarder')
      return
    }

    const isSaved = savedIds.includes(ficheId)
    const newSaved = isSaved ? savedIds.filter((id) => id !== ficheId) : [...savedIds, ficheId]
    setSavedIds(newSaved)

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ficheId }),
      })

      if (res.ok) {
        const data = await res.json()
        triggerToast(data.message || (isSaved ? 'Fiche retirée des favoris' : 'Fiche sauvegardée'))
      } else {
        triggerToast(isSaved ? 'Fiche retirée des favoris' : 'Fiche sauvegardée')
      }
    } catch {
      triggerToast(isSaved ? 'Fiche retirée des favoris' : 'Fiche sauvegardée')
    }
  }

  // Filtrage combiné (Recherche textuelle + Stack) & Tri
  const filteredFiches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return initialFiches
      .filter((fiche) => {
        // Filtre de recherche
        const matchesQuery =
          !query ||
          fiche.title.toLowerCase().includes(query) ||
          fiche.problem?.toLowerCase().includes(query) ||
          fiche.tags?.some((t) => t.toLowerCase().includes(query)) ||
          fiche.stack?.some((s) => s.toLowerCase().includes(query))

        // Filtre de stack
        const matchesStack =
          selectedStack === 'all' ||
          fiche.stack?.some((s) => s.toLowerCase() === selectedStack.toLowerCase()) ||
          fiche.tags?.some((t) => t.toLowerCase() === selectedStack.toLowerCase())

        return matchesQuery && matchesStack
      })
      .sort((a, b) => {
        if (sortBy === 'recent') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        if (sortBy === 'useful') {
          return (b.useful_count || 0) - (a.useful_count || 0)
        }
        if (sortBy === 'views') {
          return (b.view_count || 0) - (a.view_count || 0)
        }
        return 0
      })
  }, [initialFiches, searchQuery, selectedStack, sortBy])

  // Fiches recommandées "Pour toi" (si connecté avec stacks préférées)
  const recommendedFiches = useMemo(() => {
    const prefs = user?.preferred_stacks || []
    if (!prefs || prefs.length === 0) return []

    const lowerPrefs = prefs.map((p) => p.toLowerCase())
    return initialFiches
      .filter((fiche) => {
        return (
          fiche.stack?.some((s) => lowerPrefs.includes(s.toLowerCase())) ||
          fiche.tags?.some((t) => lowerPrefs.includes(t.toLowerCase()))
        )
      })
      .slice(0, 3)
  }, [initialFiches, user?.preferred_stacks])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative">
      <Header user={user} />

      {/* Toast notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 bg-foreground text-background px-4 py-2.5 rounded-md text-sm font-medium shadow-xl transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-accent" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-10 space-y-8">
        {/* En-tête sobre */}
        <div className="text-center space-y-2 pt-2 pb-1">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Fiche
          </h1>
          <p className="text-sm sm:text-base text-muted max-w-lg mx-auto">
            Le savoir technique de la communauté, structuré et capitalisé.
          </p>
        </div>

        {/* Section Recommandée "Pour toi" */}
        {recommendedFiches.length > 0 && (
          <section className="bg-card border border-border rounded-lg p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>Pour toi (recommandé selon tes stacks)</span>
              </div>
              <span className="text-xs text-muted">
                {user?.preferred_stacks?.join(', ')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendedFiches.map((fiche) => (
                <Link
                  key={`rec-${fiche.id}`}
                  href={`/fiche/${fiche.id}`}
                  className="bg-background border border-border hover:border-accent/60 rounded-md p-4 space-y-2 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-accent font-medium">Recommandé</span>
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                      {fiche.title}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-border/40">
                    <span className="inline-flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-accent" />
                      {fiche.useful_count || 0}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3 h-3 text-muted" />
                      {fiche.view_count || 0}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Barre de recherche centrale */}
        <div className="max-w-2xl mx-auto">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une fiche par problème, mot-clé ou techno (ex: React, CORS, Next.js)..."
            className="w-full bg-card border border-border p-3.5 pl-4 rounded-md text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent shadow-sm text-sm transition-all"
          />
        </div>

        {/* Disposition Principale : Sidebar Filtres + Grille */}
        <div className="flex flex-col md:flex-row items-start gap-8">
          {/* Sidebar de filtres (à gauche sur desktop, en haut sur mobile) */}
          <aside className="w-full md:w-64 shrink-0 bg-card border border-border rounded-lg p-5 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted inline-flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-accent" />
                <span>Filtres</span>
              </span>
              {(selectedStack !== 'all' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStack('all')
                    setSearchQuery('')
                  }}
                  className="text-xs text-accent hover:underline"
                >
                  Réinitialiser
                </button>
              )}
            </div>

            {/* Tri */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-foreground inline-flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
                <span>Trier par</span>
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent shadow-xs"
              >
                <option value="recent">Plus récentes</option>
                <option value="useful">Plus utiles (votes)</option>
                <option value="views">Plus vues</option>
              </select>
            </div>

            {/* Filtre par Stack */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-foreground">
                Stack technique
              </label>
              <div className="flex flex-wrap md:flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => setSelectedStack('all')}
                  className={`text-left text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                    selectedStack === 'all'
                      ? 'bg-accent text-white dark:text-background'
                      : 'text-muted hover:text-foreground hover:bg-background'
                  }`}
                >
                  Toutes les stacks
                </button>

                {availableStacks.map((stk) => {
                  const isSelected = selectedStack.toLowerCase() === stk.toLowerCase()
                  return (
                    <button
                      key={stk}
                      type="button"
                      onClick={() => setSelectedStack(isSelected ? 'all' : stk)}
                      className={`text-left text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors truncate ${
                        isSelected
                          ? 'bg-accent text-white dark:text-background'
                          : 'text-muted hover:text-foreground hover:bg-background'
                      }`}
                    >
                      {stk}
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>

          {/* Grille des fiches */}
          <section className="flex-1 w-full space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                {filteredFiches.length} fiche{filteredFiches.length > 1 ? 's' : ''} disponible{filteredFiches.length > 1 ? 's' : ''}
              </span>
              {selectedStack !== 'all' && (
                <span className="text-xs bg-accent-light text-accent px-2.5 py-0.5 rounded-full font-medium">
                  Filtre actif : {selectedStack}
                </span>
              )}
            </div>

            {filteredFiches.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-12 text-center shadow-sm space-y-2">
                <p className="text-sm font-medium text-foreground">Aucune fiche ne correspond à tes critères.</p>
                <p className="text-xs text-muted">Essaie d'élargir ta recherche ou de réinitialiser les filtres.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFiches.map((fiche) => {
                  const isSaved = savedIds.includes(fiche.id)
                  const dateFormatted = new Date(fiche.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })

                  return (
                    <div
                      key={fiche.id}
                      className="bg-card border border-border hover:border-gray-400 dark:hover:border-gray-600 rounded-lg p-5 flex flex-col justify-between space-y-4 transition-all shadow-sm group relative"
                    >
                      <div className="space-y-2.5">
                        {/* En-tête de carte : Auteur + Date + Signet Bookmark */}
                        <div className="flex items-center justify-between gap-2 text-xs text-muted">
                          <span className="truncate">Par {fiche.author_name || 'Senior'} • {dateFormatted}</span>
                          <button
                            type="button"
                            onClick={(e) => handleToggleFavorite(e, fiche.id)}
                            title={isSaved ? 'Retirer des favoris' : 'Sauvegarder la fiche'}
                            className={`p-1.5 rounded-md transition-colors ${
                              isSaved
                                ? 'text-accent bg-accent-light'
                                : 'text-muted hover:text-foreground hover:bg-background'
                            }`}
                          >
                            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        {/* Titre (limité à 2 lignes) */}
                        <Link href={`/fiche/${fiche.id}`} className="block">
                          <h2 className="text-base font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                            {fiche.title}
                          </h2>
                        </Link>

                        {/* Badges Stack & Tags */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {fiche.tags &&
                            fiche.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="bg-accent-light text-accent text-[11px] px-2 py-0.5 rounded-full font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          {fiche.stack &&
                            fiche.stack.slice(0, 2).map((item, idx) => (
                              <span
                                key={`stack-${idx}`}
                                className="bg-accent-light text-accent text-[11px] px-2 py-0.5 rounded-full font-medium"
                              >
                                {item}
                              </span>
                            ))}
                        </div>
                      </div>

                      {/* Footer de carte compact : Vues et Votes Utiles */}
                      <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted">
                        <span className="inline-flex items-center gap-1">
                          <ThumbsUp className="w-3.5 h-3.5 text-accent" />
                          <span>{fiche.useful_count || 0} utile</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-muted" />
                          <span>{fiche.view_count || 0} vue{fiche.view_count > 1 ? 's' : ''}</span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
