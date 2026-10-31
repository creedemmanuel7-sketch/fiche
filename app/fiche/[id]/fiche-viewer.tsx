'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { getFingerprint } from '@/lib/fingerprint'

interface FicheViewerProps {
  fiche: {
    id: string
    title: string
    problem: string
    solution: string
    original_question?: string | null
    tags: string[]
    stack: string[]
    view_count: number
    useful_count: number
    created_at: string
    author_id: string
    author_name?: string
  }
  user?: { email?: string | null } | null
}

export default function FicheViewer({ fiche, user }: FicheViewerProps) {
  const [usefulCount, setUsefulCount] = useState(fiche.useful_count || 0)
  const [hasVoted, setHasVoted] = useState(false)
  const [voting, setVoting] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)

  const hasRecordedView = useRef(false)

  // Enregistrement unique de la vue au montage
  useEffect(() => {
    if (hasRecordedView.current) return
    hasRecordedView.current = true

    const fp = getFingerprint()
    fetch('/api/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ficheId: fiche.id, fingerprint: fp }),
    }).catch((err) => console.error('Erreur enregistrement vue:', err))
  }, [fiche.id])

  const handleVote = async () => {
    if (hasVoted || voting) return
    setVoting(true)
    const fp = getFingerprint()

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ficheId: fiche.id, fingerprint: fp }),
      })

      if (res.ok) {
        const data = await res.json()
        setUsefulCount(data.useful_count ?? usefulCount + 1)
        setHasVoted(true)
      } else if (res.status === 400) {
        setHasVoted(true)
      }
    } catch (err) {
      console.error('Erreur vote:', err)
    } finally {
      setVoting(false)
    }
  }

  const dateFormatted = new Date(fiche.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header user={user} />

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 sm:p-10 space-y-8">
        {/* Navigation retour */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <Link
            href="/"
            className="text-sm font-medium text-muted hover:text-foreground transition-colors inline-flex items-center gap-1.5"
          >
            ← Retour à l'accueil
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted">
            <span>Auteur : {fiche.author_name || 'Senior'}</span>
            <span>•</span>
            <span>{dateFormatted}</span>
          </div>
        </div>

        {/* Titre et badges */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground leading-tight">
            {fiche.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            {fiche.tags &&
              fiche.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-accent-light text-accent text-xs px-2.5 py-1 rounded-full font-medium"
                >
                  {tag}
                </span>
              ))}
            {fiche.stack &&
              fiche.stack.map((item, idx) => (
                <span
                  key={`stack-${idx}`}
                  className="bg-accent-light text-accent text-xs px-2.5 py-1 rounded-full font-medium"
                >
                  {item}
                </span>
              ))}
          </div>
        </div>

        {/* Bloc Problème */}
        <section className="bg-white border border-border rounded-md p-6 space-y-2 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
            Problème
          </h2>
          <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-wrap">
            {fiche.problem}
          </p>
        </section>

        {/* Bloc Solution */}
        <section className="bg-white border border-border rounded-md p-6 space-y-2 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
            Solution
          </h2>
          <div className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-wrap">
            {fiche.solution}
          </div>
        </section>

        {/* Bloc dépliable Question d'origine (accordéon propre avec chevron) */}
        {fiche.original_question && (
          <div className="border border-border bg-gray-50/70 rounded-md p-4 transition-all">
            <button
              type="button"
              onClick={() => setShowOriginal(!showOriginal)}
              className="w-full flex items-center justify-between text-left text-xs font-medium text-muted hover:text-foreground transition-colors"
            >
              <span>Voir la question d'origine</span>
              <svg
                className={`w-4 h-4 text-muted transition-transform duration-200 ${
                  showOriginal ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showOriginal && (
              <div className="mt-3 pt-3 border-t border-border/60 text-xs text-foreground/80 italic whitespace-pre-wrap leading-relaxed">
                {fiche.original_question}
              </div>
            )}
          </div>
        )}

        {/* Bouton Utile & Métriques */}
        <div className="flex items-center justify-between pt-6 border-t border-border">
          <button
            type="button"
            id="useful-vote-button"
            onClick={handleVote}
            disabled={hasVoted || voting}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all shadow-sm ${
              hasVoted
                ? 'bg-gray-100 text-muted cursor-not-allowed border border-border'
                : 'bg-foreground text-white hover:bg-black/85 active:scale-[0.98]'
            }`}
          >
            {hasVoted ? (
              <>
                <span>✓</span>
                <span>Déjà voté ({usefulCount})</span>
              </>
            ) : (
              <>
                <span>👍</span>
                <span>Utile ({usefulCount})</span>
              </>
            )}
          </button>

          <div className="text-sm text-muted">
            👁 {fiche.view_count || 0} vue{fiche.view_count > 1 ? 's' : ''}
          </div>
        </div>
      </main>
    </div>
  )
}
