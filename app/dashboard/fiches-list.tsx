'use client'

import { useState } from 'react'
import Link from 'next/link'

export interface FicheItem {
  id: string
  title: string
  tags: string[]
  stack: string[]
  view_count: number
  useful_count: number
  created_at: string
}

export interface FicheFeedbackData {
  yesCount: number
  noCount: number
  comments: {
    id: string
    comment: string
    created_at: string
  }[]
}

interface FichesListProps {
  fiches: FicheItem[]
  feedbackMap: Record<string, FicheFeedbackData>
}

export default function FichesList({ fiches, feedbackMap }: FichesListProps) {
  const [activeFiche, setActiveFiche] = useState<{
    title: string
    feedback: FicheFeedbackData
  } | null>(null)

  return (
    <>
      <div className="grid gap-4">
        {fiches.map((fiche) => {
          const dateFormatted = new Date(fiche.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })

          const fb = feedbackMap[fiche.id] || { yesCount: 0, noCount: 0, comments: [] }

          return (
            <div
              key={fiche.id}
              className="bg-card border border-border hover:border-gray-400 dark:hover:border-gray-600 rounded-md p-5 space-y-3.5 transition-all shadow-sm"
            >
              {/* Titre et Date */}
              <div className="flex items-start justify-between gap-4">
                <Link
                  href={`/fiche/${fiche.id}`}
                  className="text-lg font-semibold text-foreground hover:underline leading-snug"
                >
                  {fiche.title}
                </Link>
                <span className="text-sm text-muted whitespace-nowrap">{dateFormatted}</span>
              </div>

              {/* Tags & Stack */}
              <div className="flex flex-wrap items-center gap-1.5">
                {fiche.tags &&
                  fiche.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-accent-light text-accent text-xs px-2 py-0.5 rounded-full font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                {fiche.stack &&
                  fiche.stack.map((item, idx) => (
                    <span
                      key={`stack-${idx}`}
                      className="bg-accent-light text-accent text-xs px-2 py-0.5 rounded-full font-medium"
                    >
                      {item}
                    </span>
                  ))}
              </div>

              {/* Métriques & Feedback */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/50 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="bg-card text-muted border border-border px-2.5 py-1 rounded-full text-xs">
                    👁 {fiche.view_count || 0} vue{fiche.view_count > 1 ? 's' : ''}
                  </span>
                  <span className="bg-card text-muted border border-border px-2.5 py-1 rounded-full text-xs">
                    👍 {fiche.useful_count || 0} utile
                  </span>
                </div>

                {/* Section Feedback Retours Utilisateurs */}
                <div className="flex items-center gap-2.5">
                  <span
                    id={`feedback-indicator-${fiche.id}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-background border border-border text-foreground"
                  >
                    <span>👍 {fb.yesCount} Oui</span>
                    <span className="text-muted">·</span>
                    <span>👎 {fb.noCount} Non</span>
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveFiche({
                        title: fiche.title,
                        feedback: fb,
                      })
                    }
                    className="see-feedback-btn text-xs font-medium text-accent hover:underline px-2 py-1 rounded transition-colors"
                  >
                    Voir les retours
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modale des retours de feedback */}
      {activeFiche && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setActiveFiche(null)}
        >
          <div
            className="bg-card border border-border rounded-lg max-w-lg w-full p-6 space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modale */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-semibold text-foreground">Retours sur la fiche</h3>
                <p className="text-xs text-muted mt-0.5 line-clamp-1">{activeFiche.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveFiche(null)}
                className="text-muted hover:text-foreground p-1 rounded-md transition-colors"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Compteurs Oui / Non */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background border border-border rounded-md p-3.5 text-center space-y-1">
                <span className="text-xs text-muted font-medium">👍 A résolu le problème</span>
                <p className="text-2xl font-bold text-accent">{activeFiche.feedback.yesCount}</p>
              </div>
              <div className="bg-background border border-border rounded-md p-3.5 text-center space-y-1">
                <span className="text-xs text-muted font-medium">👎 N'a pas résolu</span>
                <p className="text-2xl font-bold text-foreground">{activeFiche.feedback.noCount}</p>
              </div>
            </div>

            {/* Commentaires anonymes */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">
                Commentaires anonymes ({activeFiche.feedback.comments.length})
              </h4>

              {activeFiche.feedback.comments.length === 0 ? (
                <div className="bg-background border border-border rounded-md p-4 text-center">
                  <p className="text-xs text-muted">Aucun commentaire détaillé laissé pour le moment.</p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {activeFiche.feedback.comments.map((c) => {
                    const cDate = new Date(c.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                    return (
                      <div
                        key={c.id}
                        className="bg-background border border-border rounded-md p-3 text-xs space-y-1.5"
                      >
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">{c.comment}</p>
                        <span className="text-[10px] text-muted block text-right">{cDate}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveFiche(null)}
                className="bg-foreground text-background hover:opacity-90 px-4 py-2 rounded-md text-xs font-medium transition-all shadow-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
