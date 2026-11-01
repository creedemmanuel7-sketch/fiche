'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { getFingerprint } from '@/lib/fingerprint'
import { getCategoryBadgeClass, resolveCategory } from '@/components/FicheCard'
import { ThumbsUp, ThumbsDown, Eye, Check, Bookmark } from 'lucide-react'

interface FicheViewerProps {
  fiche: {
    id: string
    title: string
    problem: string
    solution: string
    category?: string
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

  // Feedback states
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  // Toast state
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Saved / Bookmark state
  const [isSaved, setIsSaved] = useState(false)

  const hasRecordedView = useRef(false)

  // Enregistrement de la vue et vérification du feedback existant au montage
  useEffect(() => {
    const fp = getFingerprint()

    if (!hasRecordedView.current) {
      hasRecordedView.current = true
      fetch('/api/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ficheId: fiche.id, fingerprint: fp }),
      }).catch((err) => console.error('Erreur enregistrement vue:', err))
    }

    // Vérifier si le visiteur a déjà soumis un feedback
    fetch(`/api/feedback?ficheId=${encodeURIComponent(fiche.id)}&fingerprint=${encodeURIComponent(fp)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.hasFeedback) {
          setFeedbackSubmitted(true)
        }
      })
      .catch((err) => console.error('Erreur vérification feedback:', err))

    // Vérifier si la fiche est sauvegardée
    if (user) {
      fetch('/api/favorites')
        .then((res) => res.json())
        .then((data) => {
          if (data?.savedFicheIds && Array.isArray(data.savedFicheIds)) {
            setIsSaved(data.savedFicheIds.includes(fiche.id))
          }
        })
        .catch(() => {})
    }
  }, [fiche.id, user])

  const handleToggleBookmark = async () => {
    if (!user) {
      triggerToast('Connecte-toi pour sauvegarder')
      return
    }

    const nextState = !isSaved
    setIsSaved(nextState)

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ficheId: fiche.id }),
      })
      if (res.ok) {
        const data = await res.json()
        triggerToast(data.message || (nextState ? 'Fiche ajoutée aux favoris' : 'Fiche retirée des favoris'))
      } else {
        triggerToast(nextState ? 'Fiche ajoutée aux favoris' : 'Fiche retirée des favoris')
      }
    } catch {
      triggerToast(nextState ? 'Fiche ajoutée aux favoris' : 'Fiche retirée des favoris')
    }
  }

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
    }, 2500)
  }

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

  const handleCopyLink = async () => {
    try {
      const url = window.location.href
      await navigator.clipboard.writeText(url)
      triggerToast('Lien copié !')
    } catch {
      // Fallback si l'API clipboard est bloquée
      triggerToast('Lien copié !')
    }
  }

  const handleShareLinkedIn = () => {
    const url = window.location.href
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=600')
  }

  const handleFeedback = async (isUseful: boolean, comment?: string) => {
    if (submittingFeedback) return
    setSubmittingFeedback(true)
    const fp = getFingerprint()

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ficheId: fiche.id,
          isUseful,
          comment: comment || null,
          fingerprint: fp,
        }),
      })

      if (res.ok || res.status === 400) {
        setFeedbackSubmitted(true)
        setShowCommentInput(false)
      }
    } catch (err) {
      console.error('Erreur envoi feedback:', err)
      // On valide visuellement pour l'expérience utilisateur
      setFeedbackSubmitted(true)
    } finally {
      setSubmittingFeedback(false)
    }
  }

  const dateFormatted = new Date(fiche.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative">
      <Header user={user} />

      {/* Toast notification */}
      {showToast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 bg-foreground text-background px-4 py-2.5 rounded-md text-sm font-medium shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-accent" />
          <span>{toastMessage}</span>
        </div>
      )}

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
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground leading-tight">
              {fiche.title}
            </h1>
            <span
              className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${getCategoryBadgeClass(
                resolveCategory(fiche)
              )}`}
            >
              {resolveCategory(fiche)}
            </span>
          </div>

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
        <section className="bg-card border border-border rounded-md p-6 space-y-2 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
            Problème
          </h2>
          <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-wrap">
            {fiche.problem}
          </p>
        </section>

        {/* Bloc Solution */}
        <section className="bg-card border border-border rounded-md p-6 space-y-2 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
            Solution
          </h2>
          <div className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-wrap">
            {fiche.solution}
          </div>
        </section>

        {/* Bloc dépliable Question d'origine */}
        {fiche.original_question && (
          <div className="border border-border bg-card/70 rounded-md p-4 transition-all">
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

        {/* Bouton Utile & Partage */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-border">
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="useful-vote-button"
              onClick={handleVote}
              disabled={hasVoted || voting}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all shadow-sm ${
                hasVoted
                  ? 'bg-card text-muted cursor-not-allowed border border-border'
                  : 'bg-foreground text-background hover:opacity-90 active:scale-[0.98]'
              }`}
            >
              {hasVoted ? (
                <>
                  <Check className="w-4 h-4 text-muted" />
                  <span>Déjà voté ({usefulCount})</span>
                </>
              ) : (
                <>
                  <ThumbsUp className="w-4 h-4" />
                  <span>Utile ({usefulCount})</span>
                </>
              )}
            </button>

            {/* Bouton Sauvegarder (Bookmark) */}
            <button
              type="button"
              id="bookmark-button"
              onClick={handleToggleBookmark}
              title={isSaved ? 'Retirer des favoris' : 'Sauvegarder cette fiche'}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-md text-sm font-medium border transition-all shadow-sm active:scale-[0.98] ${
                isSaved
                  ? 'bg-accent-light text-accent border-accent/40'
                  : 'bg-card border-border hover:border-gray-400 dark:hover:border-gray-600 text-foreground'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{isSaved ? 'Sauvegardé' : 'Sauvegarder'}</span>
            </button>

            {/* Bouton Partager (copie lien) */}
            <button
              type="button"
              id="share-link-button"
              onClick={handleCopyLink}
              title="Copier le lien de la fiche"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-md text-sm font-medium bg-card border border-border hover:border-gray-400 dark:hover:border-gray-600 text-foreground transition-all shadow-sm active:scale-[0.98]"
            >
              <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <span>Partager</span>
            </button>

            {/* Bouton Partager sur LinkedIn */}
            <button
              type="button"
              id="share-linkedin-button"
              onClick={handleShareLinkedIn}
              title="Partager sur LinkedIn"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-md text-sm font-medium bg-card border border-border hover:border-gray-400 dark:hover:border-gray-600 text-muted hover:text-foreground transition-all shadow-sm active:scale-[0.98]"
            >
              <svg className="w-4 h-4 fill-current text-[#0A66C2]" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
              <span className="hidden sm:inline text-xs">LinkedIn</span>
            </button>
          </div>

          <div className="text-sm text-muted inline-flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-muted" />
            <span>{fiche.view_count || 0} vue{fiche.view_count > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Section Feedback d'utilité : Cette fiche a-t-elle résolu ton problème ? */}
        <section
          id="fiche-feedback-section"
          className="bg-card border border-border rounded-md p-6 space-y-4 shadow-sm"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              Cette fiche a-t-elle résolu ton problème ?
            </h3>
            <p className="text-xs text-muted">
              Ton retour aide l'auteur à améliorer la qualité et la complétude de cette fiche.
            </p>
          </div>

          {feedbackSubmitted ? (
            <div className="p-3.5 bg-accent-light text-accent rounded-md text-sm font-medium flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-accent" />
              <span>Merci pour ton retour !</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="feedback-yes-btn"
                  onClick={() => handleFeedback(true)}
                  disabled={submittingFeedback}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs sm:text-sm font-medium bg-background border border-border hover:border-accent text-foreground hover:text-accent transition-all shadow-sm active:scale-[0.98]"
                >
                  <ThumbsUp className="w-4 h-4 text-accent" />
                  <span>Oui</span>
                </button>

                <button
                  type="button"
                  id="feedback-no-btn"
                  onClick={() => setShowCommentInput(true)}
                  disabled={submittingFeedback}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs sm:text-sm font-medium bg-background border transition-all shadow-sm active:scale-[0.98] ${
                    showCommentInput
                      ? 'border-foreground text-foreground ring-1 ring-foreground/20'
                      : 'border-border hover:border-foreground/50 text-foreground'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4 text-muted" />
                  <span>Non</span>
                </button>
              </div>

              {showCommentInput && (
                <div className="space-y-3 pt-2">
                  <textarea
                    id="feedback-comment-textarea"
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Qu'est-ce qui manque ? (optionnel)"
                    rows={3}
                    className="w-full bg-background border border-border rounded-md p-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent resize-none transition-all"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="feedback-submit-btn"
                      onClick={() => handleFeedback(false, feedbackComment)}
                      disabled={submittingFeedback}
                      className="bg-foreground text-background hover:opacity-90 px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all shadow-sm disabled:opacity-50"
                    >
                      {submittingFeedback ? 'Envoi...' : 'Envoyer le feedback'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCommentInput(false)}
                      className="text-xs text-muted hover:text-foreground px-3 py-2 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
