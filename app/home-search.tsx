'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import FicheCard, { type PublicFiche, resolveCategory } from '@/components/FicheCard'
import { SkeletonGrid } from '@/components/SkeletonCard'
import {
  Sparkles,
  ArrowUpDown,
  Check,
  Filter,
  Search,
  X,
  ChevronDown,
  Dices,
} from 'lucide-react'

export type { PublicFiche }

interface HomeSearchProps {
  initialFiches: PublicFiche[]
  user: {
    email?: string | null
    role?: string | null
    preferred_stacks?: string[]
  } | null
  initialSavedIds?: string[]
  title?: string
  subtitle?: string
  isLoading?: boolean
}

type SortOption = 'recent' | 'useful' | 'views'

export default function HomeSearch({
  initialFiches,
  user,
  initialSavedIds = [],
  title = 'Explorer les fiches',
  subtitle = 'Recherchez, filtrez par stack et accédez à tout le savoir capitalisé.',
  isLoading = false,
}: HomeSearchProps) {
  const router = useRouter()
  const [isRolling, setIsRolling] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStacks, setSelectedStacks] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [savedIds, setSavedIds] = useState<string[]>(initialSavedIds)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Gestion du dropdown de sélection de stack avec recherche interne
  const [isStackDropdownOpen, setIsStackDropdownOpen] = useState(false)
  const [stackSearchQuery, setStackSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Pagination / Charger plus
  const [visibleCount, setVisibleCount] = useState(12)

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStackDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Extraire la liste dynamique des stacks existantes
  const availableStacks = useMemo(() => {
    const stackSet = new Set<string>()
    initialFiches.forEach((f) => {
      f.stack?.forEach((s) => stackSet.add(s.trim()))
      f.tags?.forEach((t) => stackSet.add(t.trim()))
    })
    return Array.from(stackSet).sort((a, b) => a.localeCompare(b))
  }, [initialFiches])

  // Stacks filtrées à l'intérieur du dropdown selon la saisie
  const filteredAvailableStacks = useMemo(() => {
    const q = stackSearchQuery.trim().toLowerCase()
    if (!q) return availableStacks
    return availableStacks.filter((s) => s.toLowerCase().includes(q))
  }, [availableStacks, stackSearchQuery])

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 2800)
  }

  const handleSurpriseMe = () => {
    if (isRolling) return
    setIsRolling(true)

    // Sélection aléatoire d'une fiche parmi les fiches disponibles
    const pool = initialFiches.length > 0 ? initialFiches : []
    if (pool.length === 0) {
      triggerToast('Aucune fiche disponible')
      setIsRolling(false)
      return
    }

    const randomIndex = Math.floor(Math.random() * pool.length)
    const randomFiche = pool[randomIndex]

    // Effet visuel de rotation 180° puis redirection
    setTimeout(() => {
      router.push(`/fiche/${randomFiche.id}`)
    }, 320)
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

  const handleToggleStack = (stk: string) => {
    if (selectedStacks.includes(stk)) {
      setSelectedStacks(selectedStacks.filter((s) => s !== stk))
    } else {
      setSelectedStacks([...selectedStacks, stk])
    }
    setVisibleCount(12)
  }

  const handleRemoveStack = (stk: string) => {
    setSelectedStacks(selectedStacks.filter((s) => s !== stk))
    setVisibleCount(12)
  }

  const handleClearAllFilters = () => {
    setSelectedStacks([])
    setSelectedCategory('')
    setSearchQuery('')
    setSortBy('recent')
    setVisibleCount(12)
  }

  // Filtrage combiné (Recherche textuelle + Stacks + Catégorie) & Tri
  const filteredFiches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return initialFiches
      .filter((fiche) => {
        // Filtre de recherche textuelle
        const matchesQuery =
          !query ||
          fiche.title.toLowerCase().includes(query) ||
          fiche.problem?.toLowerCase().includes(query) ||
          fiche.tags?.some((t) => t.toLowerCase().includes(query)) ||
          fiche.stack?.some((s) => s.toLowerCase().includes(query)) ||
          fiche.category?.toLowerCase().includes(query)

        // Filtre de stacks multiples
        const matchesStack =
          selectedStacks.length === 0 ||
          selectedStacks.some(
            (sel) =>
              fiche.stack?.some((s) => s.toLowerCase() === sel.toLowerCase()) ||
              fiche.tags?.some((t) => t.toLowerCase() === sel.toLowerCase())
          )

        // Filtre de catégorie
        const ficheCat = resolveCategory(fiche)
        const matchesCategory =
          !selectedCategory ||
          ficheCat.toLowerCase() === selectedCategory.toLowerCase()

        return matchesQuery && matchesStack && matchesCategory
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
  }, [initialFiches, searchQuery, selectedStacks, selectedCategory, sortBy])

  // Fiches visibles selon pagination
  const visibleFiches = useMemo(() => {
    return filteredFiches.slice(0, visibleCount)
  }, [filteredFiches, visibleCount])

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

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-10 space-y-6">
        {/* En-tête sobre */}
        <div className="text-center space-y-2 pt-2 pb-1">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-muted max-w-lg mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Section Recommandée "Pour toi" (si l'utilisateur a configuré des stacks) */}
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
                <FicheCard
                  key={`rec-${fiche.id}`}
                  fiche={fiche}
                  isSaved={savedIds.includes(fiche.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          </section>
        )}

        {/* Barre de recherche centrale + Bouton Surprends-moi */}
        <div className="max-w-2xl mx-auto flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setVisibleCount(12)
              }}
              placeholder="Rechercher une fiche par problème, mot-clé ou techno (ex: React, CORS, Next.js)..."
              className="w-full bg-card border border-border p-3.5 pl-10 rounded-md text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent shadow-sm text-sm transition-all"
            />
          </div>

          {/* Bouton "Surprends-moi" (Lucky Fiche) */}
          <button
            type="button"
            onClick={handleSurpriseMe}
            disabled={isRolling}
            title="Ouvrir une fiche au hasard"
            className={`inline-flex items-center gap-2 bg-transparent hover:bg-card border border-border p-3.5 sm:px-4 rounded-md text-sm text-muted hover:text-foreground font-medium transition-all shadow-xs shrink-0 cursor-pointer ${
              isRolling ? 'rotate-180 transition-transform duration-300' : 'transition-transform duration-300'
            }`}
          >
            <Dices className={`w-4 h-4 text-accent transition-transform duration-300 ${isRolling ? 'rotate-180' : ''}`} />
            <span className="hidden sm:inline">Surprends-moi</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* NOUVELLE BARRE DE FILTRES HORIZONTALE ET STICKY AU SCROLL */}
        {/* ========================================================= */}
        <div className="sticky top-[60px] z-10 bg-background/95 backdrop-blur border-b border-border py-3 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between gap-4">
            {/* Contrôles de filtres et badges */}
            <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-none flex-1 min-w-0">
              {/* Menu déroulant Trier par */}
              <div className="flex items-center gap-1.5 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-muted shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-card border border-border text-foreground text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent font-medium shadow-xs cursor-pointer"
                  title="Trier par"
                >
                  <option value="recent">Plus récentes</option>
                  <option value="useful">Plus utiles</option>
                  <option value="views">Plus vues</option>
                </select>
              </div>

              {/* Menu déroulant Filtrer par catégorie */}
              <div className="flex items-center gap-1.5 shrink-0">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    setVisibleCount(12)
                  }}
                  className={`border text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent font-medium shadow-xs cursor-pointer transition-colors ${
                    selectedCategory
                      ? 'bg-accent-light text-accent border-accent/40 font-semibold'
                      : 'bg-card border-border text-foreground'
                  }`}
                  aria-label="Filtrer par catégorie"
                  title="Filtrer par catégorie"
                >
                  <option value="">Toutes catégories</option>
                  <option value="Code">Code</option>
                  <option value="Carrière">Carrière</option>
                  <option value="Méthodo">Méthodo</option>
                  <option value="Contexte Local">Contexte Local</option>
                  <option value="Soft Skills">Soft Skills</option>
                </select>
              </div>

              {/* Bouton Filtrer par stack avec Dropdown & Recherche interne */}
              <div className="relative shrink-0" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsStackDropdownOpen((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-all shadow-xs ${
                    isStackDropdownOpen || selectedStacks.length > 0
                      ? 'bg-accent-light text-accent border-accent/40'
                      : 'bg-card text-foreground border-border hover:bg-background'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 text-accent" />
                  <span>Filtrer par stack</span>
                  {selectedStacks.length > 0 && (
                    <span className="bg-accent text-white dark:text-background text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                      {selectedStacks.length}
                    </span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${isStackDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Menu déroulant des stacks avec recherche interne */}
                {isStackDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-72 max-w-[85vw] bg-card border border-border rounded-lg shadow-xl p-3 z-30 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={stackSearchQuery}
                        onChange={(e) => setStackSearchQuery(e.target.value)}
                        placeholder="Rechercher une stack (ex: React)..."
                        autoFocus
                        className="w-full bg-background border border-border rounded-md pl-8 pr-2.5 py-1.5 text-xs text-foreground placeholder-muted focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                      {filteredAvailableStacks.length === 0 ? (
                        <p className="text-xs text-muted text-center py-3">
                          Aucune technologie trouvée.
                        </p>
                      ) : (
                        filteredAvailableStacks.map((stk) => {
                          const isSelected = selectedStacks.includes(stk)
                          return (
                            <button
                              key={stk}
                              type="button"
                              onClick={() => handleToggleStack(stk)}
                              className={`w-full flex items-center justify-between text-left text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                                isSelected
                                  ? 'bg-accent text-white dark:text-background font-semibold'
                                  : 'text-foreground hover:bg-background'
                              }`}
                            >
                              <span className="truncate">{stk}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1.5" />}
                            </button>
                          )
                        })
                      )}
                    </div>

                    {selectedStacks.length > 0 && (
                      <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                        <span className="text-muted">{selectedStacks.length} active(s)</span>
                        <button
                          type="button"
                          onClick={() => setSelectedStacks([])}
                          className="text-accent hover:underline font-medium"
                        >
                          Effacer la sélection
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bouton Surprends-moi (Lucky Fiche) dans la barre de filtres */}
              <button
                type="button"
                onClick={handleSurpriseMe}
                disabled={isRolling}
                title="Ouvrir une fiche au hasard"
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-border bg-transparent hover:bg-card text-muted hover:text-foreground transition-all shadow-xs shrink-0 cursor-pointer ${
                  isRolling ? 'rotate-180 transition-transform duration-300' : 'transition-transform duration-300'
                }`}
              >
                <Dices className={`w-3.5 h-3.5 text-accent transition-transform duration-300 ${isRolling ? 'rotate-180' : ''}`} />
                <span className="hidden sm:inline">Surprends-moi</span>
              </button>

              {/* Badge de catégorie sélectionnée */}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1.5 bg-accent-light text-accent text-xs font-medium px-2.5 py-1 rounded-full shrink-0 shadow-2xs animate-in fade-in">
                  <span>Catégorie: {selectedCategory}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('')
                      setVisibleCount(12)
                    }}
                    className="hover:opacity-75 focus:outline-none cursor-pointer"
                    title={`Retirer le filtre ${selectedCategory}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Badges des stacks sélectionnées avec bouton "x" pour retirer */}
              {selectedStacks.map((stk) => (
                <span
                  key={`badge-${stk}`}
                  className="inline-flex items-center gap-1.5 bg-accent-light text-accent text-xs font-medium px-2.5 py-1 rounded-full shrink-0 shadow-2xs animate-in fade-in"
                >
                  <span>{stk}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveStack(stk)}
                    className="hover:opacity-75 focus:outline-none"
                    title={`Retirer le filtre ${stk}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {/* Bouton Réinitialiser si recherche ou filtres actifs */}
              {(selectedStacks.length > 0 || searchQuery || selectedCategory) && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="text-xs text-muted hover:text-foreground shrink-0 underline decoration-muted/50 underline-offset-2 ml-1 cursor-pointer"
                >
                  Tout réinitialiser
                </button>
              )}
            </div>

            {/* Compteur de résultats */}
            <div className="shrink-0 text-xs font-semibold text-muted hidden sm:block">
              {filteredFiches.length} fiche{filteredFiches.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Grille des fiches */}
        <section className="w-full space-y-6 pt-2">
          {isLoading ? (
            <SkeletonGrid count={6} />
          ) : filteredFiches.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center shadow-sm space-y-2">
              <p className="text-sm font-medium text-foreground">Aucune fiche ne correspond à tes critères.</p>
              <p className="text-xs text-muted">Essaie d'élargir ta recherche ou d'effacer les filtres.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleFiches.map((fiche) => (
                  <FicheCard
                    key={fiche.id}
                    fiche={fiche}
                    isSaved={savedIds.includes(fiche.id)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>

              {/* Bouton Charger plus */}
              {filteredFiches.length > visibleCount && (
                <div className="text-center pt-4 pb-4">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 12)}
                    className="inline-flex items-center gap-2 bg-card hover:bg-background border border-border text-foreground px-5 py-2.5 rounded-md text-xs font-semibold shadow-xs transition-all hover:border-gray-400 dark:hover:border-gray-600"
                  >
                    <span>Charger plus de fiches ({filteredFiches.length - visibleCount} restantes)</span>
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}
