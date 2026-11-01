'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ThumbsUp, ThumbsDown, Eye, MessageSquare, BarChart3, FileText, X } from 'lucide-react'
import ImpactStats from '@/components/ImpactStats'
import type { FicheItem, FicheFeedbackData } from './fiches-list'

interface DashboardTabsProps {
  userFiches: FicheItem[]
  feedbackMap: Record<string, FicheFeedbackData>
  totalFiches: number
  totalViews: number
  totalUseful: number
  savedCount?: number
}

type TabType = 'fiches' | 'retours' | 'stats'

export default function DashboardTabs({
  userFiches,
  feedbackMap,
  totalFiches,
  totalViews,
  totalUseful,
  savedCount = 0,
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('fiches')
  const [selectedFicheModal, setSelectedFicheModal] = useState<{
    title: string
    feedback: FicheFeedbackData
  } | null>(null)

  // Agréger tous les retours pour l'onglet "Mes retours"
  const allComments = Object.entries(feedbackMap).flatMap(([ficheId, fb]) => {
    const fiche = userFiches.find((f) => f.id === ficheId)
    return fb.comments.map((c) => ({
      ...c,
      ficheId,
      ficheTitle: fiche?.title || 'Fiche technique',
    }))
  })

  const totalYes = Object.values(feedbackMap).reduce((acc, fb) => acc + fb.yesCount, 0)
  const totalNo = Object.values(feedbackMap).reduce((acc, fb) => acc + fb.noCount, 0)
  const satisfactionRate = totalYes + totalNo > 0 ? Math.round((totalYes / (totalYes + totalNo)) * 100) : 100

  return (
    <div className="space-y-6">
      {/* Navigation par Onglets (Tabs) */}
      <div className="flex items-center gap-2 border-b border-border pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('fiches')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 inline-flex items-center gap-2 ${
            activeTab === 'fiches'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Mes fiches</span>
          <span className="text-xs bg-card px-2 py-0.5 rounded-full border border-border">
            {userFiches.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('retours')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 inline-flex items-center gap-2 ${
            activeTab === 'retours'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Mes retours</span>
          <span className="text-xs bg-card px-2 py-0.5 rounded-full border border-border">
            {allComments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 inline-flex items-center gap-2 ${
            activeTab === 'stats'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Mes stats</span>
        </button>
      </div>

      {/* CONTENU ONGLET 1 : Mes Fiches (Grille) */}
      {activeTab === 'fiches' && (
        <section className="space-y-4 animate-in fade-in duration-150">
          {userFiches.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center shadow-sm space-y-3">
              <p className="text-muted text-sm">Tu n'as pas encore créé de fiche technique.</p>
              <Link
                href="/create"
                className="inline-block bg-foreground text-background px-4 py-2 rounded-md text-xs font-medium"
              >
                Créer ma première fiche
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userFiches.map((fiche) => {
                const dateFormatted = new Date(fiche.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
                const fb = feedbackMap[fiche.id] || { yesCount: 0, noCount: 0, comments: [] }

                return (
                  <div
                    key={fiche.id}
                    className="bg-card border border-border hover:border-gray-400 dark:hover:border-gray-600 rounded-lg p-5 flex flex-col justify-between space-y-4 transition-all shadow-sm group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span>{dateFormatted}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 bg-background border border-border px-2 py-0.5 rounded text-[11px]">
                            <ThumbsUp className="w-3 h-3 text-accent" />
                            {fb.yesCount}
                          </span>
                          <span className="inline-flex items-center gap-1 bg-background border border-border px-2 py-0.5 rounded text-[11px]">
                            <ThumbsDown className="w-3 h-3 text-muted" />
                            {fb.noCount}
                          </span>
                        </div>
                      </div>

                      <Link href={`/fiche/${fiche.id}`} className="block">
                        <h3 className="text-base font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                          {fiche.title}
                        </h3>
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
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-muted" />
                          {fiche.view_count || 0}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ThumbsUp className="w-3.5 h-3.5 text-accent" />
                          {fiche.useful_count || 0}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedFicheModal({ title: fiche.title, feedback: fb })}
                        className="text-accent hover:underline font-medium text-xs"
                      >
                        Voir les retours
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* CONTENU ONGLET 2 : Mes Retours */}
      {activeTab === 'retours' && (
        <section className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-5 space-y-1 shadow-sm">
              <span className="text-xs text-muted font-medium uppercase tracking-wider">Taux de résolution</span>
              <p className="text-3xl font-bold text-accent">{satisfactionRate}%</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-5 space-y-1 shadow-sm">
              <span className="text-xs text-muted font-medium uppercase tracking-wider">A résolu le problème</span>
              <p className="text-3xl font-bold text-foreground">{totalYes}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-5 space-y-1 shadow-sm">
              <span className="text-xs text-muted font-medium uppercase tracking-wider">Commentaires reçus</span>
              <p className="text-3xl font-bold text-foreground">{allComments.length}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Commentaires et suggestions des lecteurs
            </h3>

            {allComments.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-8 text-center shadow-sm">
                <p className="text-xs text-muted">Aucun commentaire détaillé reçu sur vos fiches pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allComments.map((c) => {
                  const cDate = new Date(c.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                  return (
                    <div
                      key={c.id}
                      className="bg-card border border-border rounded-lg p-4 space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between text-xs text-muted">
                        <Link href={`/fiche/${c.ficheId}`} className="font-medium text-foreground hover:underline truncate max-w-md">
                          {c.ficheTitle}
                        </Link>
                        <span>{cDate}</span>
                      </div>
                      <p className="text-sm text-foreground bg-background border border-border/70 p-3 rounded-md whitespace-pre-wrap leading-relaxed">
                        {c.comment}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CONTENU ONGLET 3 : Mes Stats (Impact) */}
      {activeTab === 'stats' && (
        <section className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-5 space-y-1 shadow-sm">
              <span className="text-xs text-muted font-medium uppercase tracking-wider">Fiches publiées</span>
              <p className="text-3xl font-bold tracking-tight text-foreground">{totalFiches}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-5 space-y-1 shadow-sm">
              <span className="text-xs text-muted font-medium uppercase tracking-wider">Vues cumulées</span>
              <p className="text-3xl font-bold tracking-tight text-foreground">{totalViews}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-5 space-y-1 shadow-sm">
              <span className="text-xs text-muted font-medium uppercase tracking-wider">Votes « Utile »</span>
              <p className="text-3xl font-bold tracking-tight text-foreground">{totalUseful}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 space-y-3 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">Indice d'impact de vos connaissances</h3>
            <p className="text-xs text-muted leading-relaxed">
              Chaque fiche que vous publiez épargne des dizaines d'heures aux membres de la communauté confrontés aux mêmes bugs.
              Avec <strong className="text-foreground">{totalViews} vues</strong> et <strong className="text-foreground">{totalUseful} votes utiles</strong>, votre contribution est activement capitalisée.
            </p>
          </div>

          {/* Reconnaissance Ouverte & Métriques d'Impact Vérifiées */}
          <section className="bg-surface-base border border-border-hairline rounded-lg p-6">
            <ImpactStats
              stats={{
                totalFiches,
                totalUseful,
                totalViews,
                savedCount,
              }}
            />
          </section>
        </section>
      )}

      {/* Modale des retours détaillée */}
      {selectedFicheModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedFicheModal(null)}
        >
          <div
            className="bg-card border border-border rounded-lg max-w-lg w-full p-6 space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-semibold text-foreground">Retours sur la fiche</h3>
                <p className="text-xs text-muted mt-0.5 line-clamp-1">{selectedFicheModal.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFicheModal(null)}
                className="text-muted hover:text-foreground p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background border border-border rounded-md p-3.5 text-center space-y-1">
                <span className="text-xs text-muted font-medium inline-flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5 text-accent" />
                  <span>A résolu</span>
                </span>
                <p className="text-2xl font-bold text-accent">{selectedFicheModal.feedback.yesCount}</p>
              </div>
              <div className="bg-background border border-border rounded-md p-3.5 text-center space-y-1">
                <span className="text-xs text-muted font-medium inline-flex items-center gap-1">
                  <ThumbsDown className="w-3.5 h-3.5 text-muted" />
                  <span>N'a pas résolu</span>
                </span>
                <p className="text-2xl font-bold text-foreground">{selectedFicheModal.feedback.noCount}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold text-muted uppercase tracking-wider inline-flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-muted" />
                <span>Commentaires anonymes ({selectedFicheModal.feedback.comments.length})</span>
              </h4>

              {selectedFicheModal.feedback.comments.length === 0 ? (
                <div className="bg-background border border-border rounded-md p-4 text-center">
                  <p className="text-xs text-muted">Aucun commentaire détaillé laissé pour le moment.</p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {selectedFicheModal.feedback.comments.map((c) => (
                    <div
                      key={c.id}
                      className="bg-background border border-border rounded-md p-3 text-xs space-y-1.5"
                    >
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap">{c.comment}</p>
                      <span className="text-[10px] text-muted block text-right">
                        {new Date(c.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedFicheModal(null)}
                className="bg-foreground text-background hover:opacity-90 px-4 py-2 rounded-md text-xs font-medium transition-all shadow-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
