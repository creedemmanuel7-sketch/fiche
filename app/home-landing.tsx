'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import FicheCard, { type PublicFiche } from '@/components/FicheCard'
import { Sparkles, ArrowRight, Check } from 'lucide-react'

interface HomeLandingProps {
  fiches: PublicFiche[]
  user: {
    email?: string | null
    role?: string | null
    preferred_stacks?: string[]
  } | null
  initialSavedIds?: string[]
  recommendedFiches?: PublicFiche[]
}

export default function HomeLanding({
  fiches,
  user,
  initialSavedIds = [],
  recommendedFiches = [],
}: HomeLandingProps) {
  const [savedIds, setSavedIds] = useState<string[]>(initialSavedIds)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

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

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-10 space-y-10">
        {/* En-tête sobre et aéré */}
        <div className="text-center space-y-3 pt-6 pb-2">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Fiche
          </h1>
          <p className="text-base sm:text-lg text-muted max-w-xl mx-auto">
            Le savoir technique de la communauté, structuré et capitalisé.
          </p>
        </div>

        {/* Section Recommandée "Pour toi" (si connecté avec stacks préférées) */}
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

        {/* Dernières fiches publiées (max 6) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
              Dernières fiches publiées
            </h2>
            <Link
              href="/explorer"
              className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-1"
            >
              <span>Accéder à toutes les fiches</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fiches.map((fiche) => (
              <FicheCard
                key={fiche.id}
                fiche={fiche}
                isSaved={savedIds.includes(fiche.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>

          {/* Bouton Voir toutes les fiches */}
          <div className="text-center pt-8 pb-6">
            <Link
              href="/explorer"
              className="inline-flex items-center gap-2.5 bg-foreground text-background hover:opacity-90 px-7 py-3 rounded-md text-sm font-semibold transition-all shadow-md group"
            >
              <span>Voir toutes les fiches</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
