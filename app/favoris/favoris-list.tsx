'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bookmark, ThumbsUp, Eye, Check } from 'lucide-react'
import type { PublicFiche } from '../home-search'

interface FavorisListProps {
  initialFiches: PublicFiche[]
}

export default function FavorisList({ initialFiches }: FavorisListProps) {
  const [fiches, setFiches] = useState<PublicFiche[]>(initialFiches)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 2800)
  }

  const handleRemoveFavorite = async (e: React.MouseEvent, ficheId: string) => {
    e.preventDefault()
    e.stopPropagation()

    setFiches((prev) => prev.filter((f) => f.id !== ficheId))

    try {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ficheId }),
      })
      triggerToast('Fiche retirée des favoris')
    } catch {
      triggerToast('Fiche retirée des favoris')
    }
  }

  return (
    <>
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 bg-foreground text-background px-4 py-2.5 rounded-md text-sm font-medium shadow-xl transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-accent" />
          <span>{toastMessage}</span>
        </div>
      )}

      {fiches.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center shadow-sm space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-accent-light text-accent flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">Aucun favori pour l'instant</h3>
            <p className="text-xs text-muted leading-relaxed">
              En explorant les fiches techniques, clique sur l'icône de signet pour les retrouver ici en un clic.
            </p>
          </div>
          <Link
            href="/"
            className="inline-block bg-foreground text-background hover:opacity-90 px-4 py-2 rounded-md text-xs font-medium transition-all shadow-sm"
          >
            Explorer les fiches
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <span className="text-xs text-muted font-medium">
            {fiches.length} fiche{fiches.length > 1 ? 's' : ''} sauvegardée{fiches.length > 1 ? 's' : ''}
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fiches.map((fiche) => {
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
                    <div className="flex items-center justify-between gap-2 text-xs text-muted">
                      <span className="truncate">Par {fiche.author_name || 'Senior'} • {dateFormatted}</span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveFavorite(e, fiche.id)}
                        title="Retirer des favoris"
                        className="p-1.5 rounded-md text-accent bg-accent-light hover:opacity-80 transition-opacity"
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <Link href={`/fiche/${fiche.id}`} className="block">
                      <h2 className="text-base font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                        {fiche.title}
                      </h2>
                    </Link>

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
                    </div>
                  </div>

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
        </div>
      )}
    </>
  )
}
