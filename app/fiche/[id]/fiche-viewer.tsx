'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
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
}

export default function FicheViewer({ fiche }: FicheViewerProps) {
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
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] p-6 sm:p-12">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Navigation retour */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5]">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-black transition-colors"
          >
            ← Retour à l'accueil
          </Link>
          <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
            <span>Auteur : {fiche.author_name || 'Senior'}</span>
            <span>•</span>
            <span>{dateFormatted}</span>
          </div>
        </div>

        {/* Titre et badges */}
        <div className="space-y-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1A1A] leading-tight">
            {fiche.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            {fiche.tags &&
              fiche.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            {fiche.stack &&
              fiche.stack.map((item, idx) => (
                <span
                  key={`stack-${idx}`}
                  className="border border-[#E5E5E5] bg-white text-gray-500 px-2.5 py-1 rounded text-xs font-medium"
                >
                  {item}
                </span>
              ))}
          </div>
        </div>

        {/* Bloc Problème */}
        <section className="bg-white border border-[#E5E5E5] rounded p-6 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Problème
          </h2>
          <p className="text-sm sm:text-base text-[#1A1A1A] leading-relaxed whitespace-pre-wrap">
            {fiche.problem}
          </p>
        </section>

        {/* Bloc Solution */}
        <section className="bg-white border border-[#E5E5E5] rounded p-6 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Solution
          </h2>
          <div className="text-sm sm:text-base text-[#1A1A1A] leading-relaxed whitespace-pre-wrap">
            {fiche.solution}
          </div>
        </section>

        {/* Bloc dépliable Question d'origine */}
        {fiche.original_question && (
          <div className="border border-[#E5E5E5] bg-white rounded p-4">
            <button
              type="button"
              onClick={() => setShowOriginal(!showOriginal)}
              className="w-full flex items-center justify-between text-left text-xs font-medium text-gray-500 hover:text-black transition-colors"
            >
              <span>Voir la question d'origine</span>
              <span>{showOriginal ? '▲ Masquer' : '▼ Déplier'}</span>
            </button>
            {showOriginal && (
              <div className="mt-3 pt-3 border-t border-[#F5F5F5] text-xs text-gray-600 italic whitespace-pre-wrap">
                {fiche.original_question}
              </div>
            )}
          </div>
        )}

        {/* Bouton Utile & Métriques */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E5E5E5]">
          <button
            type="button"
            id="useful-vote-button"
            onClick={handleVote}
            disabled={hasVoted || voting}
            className={`px-5 py-2.5 rounded text-sm font-medium transition-colors ${
              hasVoted
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed border border-[#E5E5E5]'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {hasVoted ? '✓ Déjà voté' : '👍 Utile'} ({usefulCount})
          </button>

          <div className="text-xs text-gray-400 font-mono">
            {fiche.view_count || 0} vue{fiche.view_count > 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  )
}
