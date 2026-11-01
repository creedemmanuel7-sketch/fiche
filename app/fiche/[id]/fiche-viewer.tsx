'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/Header'
import { getFingerprint } from '@/lib/fingerprint'
import { getCategoryBadgeClass, resolveCategory } from '@/components/FicheCard'
import { ThumbsUp, ThumbsDown, Eye, Check, Bookmark } from 'lucide-react'
import { Linkedin } from '@/components/icons/Linkedin'
import { createClient } from '@/lib/supabase/client'

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
    author_linkedin_url?: string | null
  }
  user?: { email?: string | null } | null
}

function FormattedContent({ content }: { content: string }) {
  if (!content) return null
  const parts = content.split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-2">
      {parts.map((part, idx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const firstLineBreak = part.indexOf('\n')
          let language = ''
          let code = ''
          if (firstLineBreak !== -1) {
            language = part.slice(3, firstLineBreak).trim()
            code = part.slice(firstLineBreak + 1, -3)
          } else {
            code = part.slice(3, -3)
          }

          return (
            <div key={idx} className="my-2.5">
              {language && (
                <div className="text-[10px] font-mono text-text-muted px-2 py-0.5 bg-surface-raised border-t border-x border-border-hairline rounded-t-md inline-block uppercase">
                  {language}
                </div>
              )}
              <pre className="overflow-x-auto max-w-full bg-surface-raised border border-border-hairline rounded-md p-3.5 sm:p-4 font-mono text-xs text-text-primary leading-relaxed">
                <code className="font-mono whitespace-pre">{code.replace(/^\n+|\n+$/g, '')}</code>
              </pre>
            </div>
          )
        }

        return (
          <p key={idx} className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base text-text-primary">
            {part}
          </p>
        )
      })}
    </div>
  )
}

export default function FicheViewer({ fiche, user }: FicheViewerProps) {
  const [usefulCount, setUsefulCount] = useState(fiche.useful_count || 0)
  const [hasVoted, setHasVoted] = useState(false)
  const [justVoted, setJustVoted] = useState(false)
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

  // Reconnaissance Ouverte : Impact réel de l'auteur
  const [authorImpact, setAuthorImpact] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    if (!fiche.author_id) return

    const fetchAuthorImpact = async () => {
      try {
        const { data } = await supabase
          .from('fiches')
          .select('useful_count')
          .eq('author_id', fiche.author_id)

        if (data && data.length > 0) {
          const totalUseful = data.reduce((acc, f) => acc + (f.useful_count || 0), 0)
          const count = data.length
          if (totalUseful >= 10) {
            setAuthorImpact(`Top Contributeur · ${totalUseful} votes utiles`)
          } else if (totalUseful > 0) {
            setAuthorImpact(`Auteur vérifié · ${totalUseful} vote${totalUseful > 1 ? 's' : ''} utile${totalUseful > 1 ? 's' : ''}`)
          } else if (count >= 3) {
            setAuthorImpact(`Contributeur actif · ${count} fiches publiées`)
          } else {
            setAuthorImpact(`Auteur · ${count} fiche${count > 1 ? 's' : ''}`)
          }
        }
      } catch (err) {
        console.error('Erreur chargement impact auteur:', err)
      }
    }

    fetchAuthorImpact()
  }, [fiche.author_id, supabase])

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
        setJustVoted(true)
        setTimeout(() => setJustVoted(false), 1200)
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
    <div className="min-h-screen bg-surface-canvas text-text-primary flex flex-col relative">
      <Header user={user} />

      {/* Toast notification avec animation spring Framer Motion */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 bg-surface-raised border border-border-hairline text-text-primary px-4 py-2.5 rounded-md text-sm font-medium flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-accent stroke-[3]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 sm:p-10 space-y-8 pb-28 md:pb-10">
        {/* Navigation retour */}
        <div className="flex items-center justify-between pb-4 border-b border-border-hairline">
          <Link
            href="/"
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors inline-flex items-center gap-1.5"
          >
            ← Retour à l'accueil
          </Link>
          <div className="flex flex-col items-end gap-1 text-right">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="inline-flex items-center gap-1.5">
                <span>Auteur : {fiche.author_name || 'Équipe Fiche'}</span>
                {fiche.author_linkedin_url && (
                  <a
                    href={fiche.author_linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Voir le profil LinkedIn de l'auteur (Proof-of-Work)"
                    className="inline-flex items-center gap-1 text-[#0A66C2] hover:opacity-85 transition-opacity bg-[#0A66C2]/10 border border-[#0A66C2]/25 px-1.5 py-0.5 rounded text-xs font-medium ml-0.5"
                  >
                    <Linkedin className="w-3.5 h-3.5 fill-current" />
                    <span className="hidden sm:inline">LinkedIn</span>
                  </a>
                )}
              </span>
              <span>•</span>
              <span>{dateFormatted}</span>
            </div>
            {authorImpact && (
              <div
                id="author-recognition-badge"
                className="text-[11px] font-medium text-accent inline-flex items-center gap-1.5 bg-accent-light border border-accent/25 px-2 py-0.5 rounded-full"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span>{authorImpact}</span>
              </div>
            )}
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
                  className="bg-surface-raised border border-border-hairline text-text-secondary text-xs px-2.5 py-1 rounded-full font-medium"
                >
                  {tag}
                </span>
              ))}
            {fiche.stack &&
              fiche.stack.map((item, idx) => (
                <span
                  key={`stack-${idx}`}
                  className="bg-surface-raised border border-border-hairline text-accent text-xs px-2.5 py-1 rounded-full font-medium"
                >
                  {item}
                </span>
              ))}
          </div>
        </div>

        {/* Bloc Problème (Surface 1 Base, sans ombre) */}
        <section className="bg-surface-base border border-border-hairline rounded-md p-6 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Problème
          </h2>
          <FormattedContent content={fiche.problem || ''} />
        </section>

        {/* Bloc Solution (Surface 1 Base, sans ombre) */}
        <section className="bg-surface-base border border-border-hairline rounded-md p-6 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Solution
          </h2>
          <FormattedContent content={fiche.solution || ''} />
        </section>

        {/* Bloc dépliable Question d'origine */}
        {fiche.original_question && (
          <div className="border border-border-hairline bg-surface-raised/40 rounded-md p-4 transition-all">
            <button
              type="button"
              onClick={() => setShowOriginal(!showOriginal)}
              className="w-full flex items-center justify-between text-left text-xs font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
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
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-border-hairline">
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="useful-vote-button"
              onClick={handleVote}
              disabled={hasVoted || voting}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all ${
                hasVoted
                  ? 'bg-surface-base text-text-muted cursor-not-allowed border border-border-hairline'
                  : 'bg-text-primary text-surface-canvas hover:opacity-90 active:scale-[0.98]'
              }`}
            >
              {hasVoted ? (
                <>
                  <Check className="w-4 h-4 text-text-muted" />
                  <span>Déjà voté ({usefulCount})</span>
                </>
              ) : (
                <>
                  <motion.span
                    animate={justVoted ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    className="inline-flex items-center"
                  >
                    <ThumbsUp className={`w-4 h-4 ${justVoted ? 'text-accent fill-accent' : ''}`} />
                  </motion.span>
                  <motion.span
                    animate={
                      justVoted
                        ? { color: ['#108966', '#34d399', '#108966', 'currentColor'] }
                        : {}
                    }
                    transition={{ duration: 0.9 }}
                  >
                    Utile ({usefulCount})
                  </motion.span>
                </>
              )}
            </button>

            {/* Bouton Sauvegarder (Bookmark) */}
            <button
              type="button"
              id="bookmark-button"
              onClick={handleToggleBookmark}
              title={isSaved ? 'Retirer des favoris' : 'Sauvegarder cette fiche'}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-md text-sm font-medium border transition-all active:scale-[0.98] ${
                isSaved
                  ? 'bg-accent-light text-accent border-accent/40'
                  : 'bg-surface-base border-border-hairline hover:bg-surface-raised text-text-primary'
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
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-md text-sm font-medium bg-surface-base border border-border-hairline hover:bg-surface-raised text-text-primary transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-md text-sm font-medium bg-surface-base border border-border-hairline hover:bg-surface-raised text-text-secondary hover:text-text-primary transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4 fill-current text-[#0A66C2]" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
              <span className="hidden sm:inline text-xs">LinkedIn</span>
            </button>
          </div>

          <div className="text-sm text-text-muted inline-flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-text-muted" />
            <span>{fiche.view_count || 0} vue{fiche.view_count > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Section Feedback d'utilité : Cette fiche a-t-elle résolu ton problème ? */}
        <section
          id="fiche-feedback-section"
          className="bg-surface-base border border-border-hairline rounded-md p-6 space-y-4"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-text-primary">
              Cette fiche a-t-elle résolu ton problème ?
            </h3>
            <p className="text-xs text-text-secondary">
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs sm:text-sm font-medium bg-surface-raised border border-border-hairline hover:bg-surface-overlay text-text-primary transition-all active:scale-[0.98]"
                >
                  <ThumbsUp className="w-4 h-4 text-accent" />
                  <span>Oui</span>
                </button>

                <button
                  type="button"
                  id="feedback-no-btn"
                  onClick={() => setShowCommentInput(true)}
                  disabled={submittingFeedback}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs sm:text-sm font-medium bg-surface-raised border transition-all active:scale-[0.98] ${
                    showCommentInput
                      ? 'border-border-hairline text-text-primary ring-1 ring-border-hairline'
                      : 'border-border-hairline hover:bg-surface-overlay text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4 text-text-muted" />
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
                    className="w-full bg-surface-raised border border-border-hairline rounded-md p-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent resize-none transition-all"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="feedback-submit-btn"
                      onClick={() => handleFeedback(false, feedbackComment)}
                      disabled={submittingFeedback}
                      className="bg-text-primary text-surface-canvas hover:opacity-90 px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all disabled:opacity-50"
                    >
                      {submittingFeedback ? 'Envoi...' : 'Envoyer le feedback'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCommentInput(false)}
                      className="text-xs text-text-muted hover:text-text-primary px-3 py-2 transition-colors"
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

      {/* Barre d'action fixe en bas sur mobile (Apple HIG min-h 44px, gap >= 8px) */}
      <div
        id="mobile-fiche-action-bar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-3 backdrop-blur-2xl bg-surface-canvas/80 border-t border-border-hairline pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center gap-2.5 max-w-lg mx-auto">
          {/* Bouton Utile Mobile */}
          <button
            type="button"
            id="mobile-useful-vote-button"
            onClick={handleVote}
            disabled={hasVoted || voting}
            className={`flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 rounded-md text-sm font-semibold transition-all active:scale-[0.98] ${
              hasVoted
                ? 'bg-surface-raised text-text-muted border border-border-hairline cursor-not-allowed'
                : 'bg-text-primary text-surface-canvas hover:opacity-90'
            }`}
          >
            {hasVoted ? (
              <>
                <Check className="w-4 h-4 text-text-muted shrink-0" />
                <span>Voté ({usefulCount})</span>
              </>
            ) : (
              <>
                <ThumbsUp className={`w-4 h-4 shrink-0 ${justVoted ? 'text-accent fill-accent' : ''}`} />
                <span>Utile ({usefulCount})</span>
              </>
            )}
          </button>

          {/* Bouton Partager Mobile */}
          <button
            type="button"
            id="mobile-share-link-button"
            onClick={handleCopyLink}
            title="Copier le lien de la fiche"
            className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 rounded-md text-sm font-medium bg-surface-raised border border-border-hairline hover:bg-surface-overlay text-text-primary transition-all active:scale-[0.98]"
          >
            <svg className="w-4 h-4 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <span>Partager</span>
          </button>
        </div>
      </div>
    </div>
  )
}
