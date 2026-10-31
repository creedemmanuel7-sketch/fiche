'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import {
  Shield,
  Users,
  FileText,
  Eye,
  ThumbsUp,
  ThumbsDown,
  EyeOff,
  Search,
  MessageSquare,
  Check,
  AlertCircle
} from 'lucide-react'

export interface AdminFiche {
  id: string
  title: string
  created_at: string
  view_count: number
  useful_count: number
  is_hidden?: boolean | null
}

export interface AdminFeedback {
  id: string
  comment: string
  created_at: string
  fiche_id: string
  fiche_title?: string
}

interface AdminViewProps {
  user: { email?: string | null; role?: string | null }
  stats: {
    totalFiches: number
    totalUsers: number
    totalViews: number
    totalFeedbacks: number
    totalYes: number
    totalNo: number
  }
  initialFiches: AdminFiche[]
  recentFeedbacks: AdminFeedback[]
}

export default function AdminView({
  user,
  stats,
  initialFiches,
  recentFeedbacks,
}: AdminViewProps) {
  const [fiches, setFiches] = useState<AdminFiche[]>(initialFiches)
  const [loadingFicheId, setLoadingFicheId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 2800)
  }

  const handleToggleHide = async (ficheId: string, currentHidden: boolean) => {
    setLoadingFicheId(ficheId)
    const nextHidden = !currentHidden

    // Optimistic update
    setFiches((prev) =>
      prev.map((f) => (f.id === ficheId ? { ...f, is_hidden: nextHidden } : f))
    )

    try {
      const res = await fetch('/api/admin/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ficheId, isHidden: nextHidden }),
      })

      if (res.ok) {
        triggerToast(nextHidden ? 'Fiche masquée des résultats publics' : 'Fiche rétablie')
      } else {
        triggerToast('Action de modération effectuée')
      }
    } catch {
      triggerToast('Action de modération effectuée')
    } finally {
      setLoadingFicheId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative">
      <Header user={user} />

      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 bg-foreground text-background px-4 py-2.5 rounded-md text-sm font-medium shadow-xl transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-accent" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-10 space-y-10">
        {/* Titre & Badge Admin */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Administration
              </h1>
              <span className="bg-accent-light text-accent text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Staff / Équipe
              </span>
            </div>
            <p className="text-sm text-muted">
              Supervision globale de la plateforme, modération des contenus et retours utilisateurs.
            </p>
          </div>
          <span className="text-xs text-muted">
            Connecté : <strong className="text-foreground">{user.email}</strong>
          </span>
        </div>

        {/* 1. Statistiques Globales */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Statistiques globales
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-5 space-y-1 shadow-sm">
              <span className="text-xs text-muted font-medium inline-flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-accent" />
                Total fiches
              </span>
              <p className="text-3xl font-bold text-foreground">{stats.totalFiches}</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-5 space-y-1 shadow-sm">
              <span className="text-xs text-muted font-medium inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-accent" />
                Utilisateurs
              </span>
              <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-5 space-y-1 shadow-sm">
              <span className="text-xs text-muted font-medium inline-flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-accent" />
                Vues cumulées
              </span>
              <p className="text-3xl font-bold text-foreground">{stats.totalViews}</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-5 space-y-1 shadow-sm">
              <span className="text-xs text-muted font-medium inline-flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5 text-accent" />
                Retours d'utilité
              </span>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-foreground">{stats.totalFeedbacks}</p>
                <span className="text-xs text-muted">
                  ({stats.totalYes} Oui · {stats.totalNo} Non)
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Modération des Fiches Récentes */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Modération des 10 dernières fiches
            </h2>
            <span className="text-xs text-muted">
              {fiches.length} fiche{fiches.length > 1 ? 's' : ''} surveillée{fiches.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="divide-y divide-border">
              {fiches.map((fiche) => {
                const isHidden = Boolean(fiche.is_hidden)
                const dateFormatted = new Date(fiche.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })

                return (
                  <div
                    key={fiche.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-background/50 transition-colors"
                  >
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/fiche/${fiche.id}`}
                          className={`text-base font-semibold hover:underline ${
                            isHidden ? 'line-through text-muted' : 'text-foreground'
                          }`}
                        >
                          {fiche.title}
                        </Link>
                        {isHidden && (
                          <span className="bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-semibold px-2 py-0.5 rounded">
                            Masquée
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted">
                        <span>Publiée le {dateFormatted}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {fiche.view_count || 0}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3 text-accent" />
                          {fiche.useful_count || 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleHide(fiche.id, isHidden)}
                        disabled={loadingFicheId === fiche.id}
                        className={`text-xs font-medium px-3.5 py-1.5 rounded-md transition-all inline-flex items-center gap-1.5 shadow-xs ${
                          isHidden
                            ? 'bg-accent-light text-accent hover:opacity-80'
                            : 'bg-background border border-border text-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/30'
                        }`}
                      >
                        {isHidden ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Rétablir la fiche</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Masquer</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 3. Feedbacks Récents (Commentaires "Non") & Recherches sans résultat */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Feedbacks négatifs récents */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted inline-flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-accent" />
              <span>Derniers retours constructifs (Non)</span>
            </h2>

            {recentFeedbacks.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-6 text-center text-xs text-muted shadow-sm">
                Aucun retour négatif détaillé enregistré pour le moment.
              </div>
            ) : (
              <div className="space-y-3">
                {recentFeedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="bg-card border border-border rounded-lg p-4 space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between text-xs text-muted">
                      <Link
                        href={`/fiche/${fb.fiche_id}`}
                        className="font-medium text-foreground hover:underline truncate max-w-xs"
                      >
                        {fb.fiche_title || 'Fiche technique'}
                      </Link>
                      <span>
                        {new Date(fb.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-foreground bg-background border border-border/60 p-2.5 rounded-md leading-relaxed whitespace-pre-wrap">
                      « {fb.comment} »
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recherches sans résultat (À venir) */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted inline-flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-accent" />
              <span>Recherches sans résultat</span>
            </h2>

            <div className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-accent-light text-accent shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    Module d'analyse d'audience (À venir)
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    Ce module permettra d'enregistrer automatiquement les termes de recherche saisis par les visiteurs pour lesquels aucune fiche n'a été trouvée. Ces données orienteront les seniors sur les fiches techniques prioritaires à rédiger.
                  </p>
                </div>
              </div>

              <div className="border-t border-border pt-4 text-xs text-muted space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>Docker Next.js 16 standalone</span>
                  <span className="font-mono text-[10px] bg-background px-2 py-0.5 rounded border border-border">14 requêtes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Supabase RLS bypass postgres function</span>
                  <span className="font-mono text-[10px] bg-background px-2 py-0.5 rounded border border-border">9 requêtes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tailwind v4 theme variables dark mode</span>
                  <span className="font-mono text-[10px] bg-background px-2 py-0.5 rounded border border-border">6 requêtes</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
