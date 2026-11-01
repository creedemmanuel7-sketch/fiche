'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Shield, Lock, Check } from 'lucide-react'

export const CATEGORIES = ['Code', 'Carrière', 'Méthodo', 'Contexte Local', 'Soft Skills'] as const
export type Category = (typeof CATEGORIES)[number]

interface StructuredData {
  title: string
  problem: string
  solution: string
  category?: Category
  tags: string[]
  stack: string[]
}

export default function CreateFicheForm({ userId }: { userId: string | null }) {
  const router = useRouter()
  const supabase = createClient()

  // Raw inputs
  const [rawQuestion, setRawQuestion] = useState('')
  const [rawAnswer, setRawAnswer] = useState('')

  // State
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [restoredToast, setRestoredToast] = useState(false)

  // Generated / editable fields
  const [hasGenerated, setHasGenerated] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('Code')
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')
  const [tagsStr, setTagsStr] = useState('')
  const [stackStr, setStackStr] = useState('')

  // Restauration du brouillon sauvegardé si présent dans localStorage
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('fiche_draft')
      if (savedDraft) {
        const draft = JSON.parse(savedDraft)
        if (draft.title || draft.problem || draft.solution) {
          if (draft.rawQuestion) setRawQuestion(draft.rawQuestion)
          if (draft.rawAnswer) setRawAnswer(draft.rawAnswer)
          if (draft.title) setTitle(draft.title)
          if (draft.problem) setProblem(draft.problem)
          if (draft.solution) setSolution(draft.solution)
          if (draft.tagsStr) setTagsStr(draft.tagsStr)
          if (draft.stackStr) setStackStr(draft.stackStr)
          if (draft.category && CATEGORIES.includes(draft.category)) {
            setCategory(draft.category)
          }
          setHasGenerated(true)
          localStorage.removeItem('fiche_draft')
          setRestoredToast(true)
          setTimeout(() => setRestoredToast(false), 4500)
        }
      }
    } catch (err) {
      console.error('Erreur restauration brouillon:', err)
    }
  }, [])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rawQuestion.trim() || !rawAnswer.trim()) {
      setError('Veuillez renseigner la question et la réponse brutes.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawQuestion, rawAnswer }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la génération')
      }

      const structured = data as StructuredData
      setTitle(structured.title || '')
      if (structured.category && CATEGORIES.includes(structured.category)) {
        setCategory(structured.category)
      } else {
        setCategory('Code')
      }
      setProblem(structured.problem || '')
      setSolution(structured.solution || '')
      setTagsStr(Array.isArray(structured.tags) ? structured.tags.join(', ') : '')
      setStackStr(Array.isArray(structured.stack) ? structured.stack.join(', ') : '')
      setHasGenerated(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !problem.trim() || !solution.trim()) {
      setError('Le titre, le problème et la solution sont obligatoires.')
      return
    }

    if (!userId) {
      // a. Sauvegarder l'état complet dans localStorage sous la clé fiche_draft
      const draft = {
        rawQuestion: rawQuestion.trim(),
        rawAnswer: rawAnswer.trim(),
        title: title.trim(),
        problem: problem.trim(),
        solution: solution.trim(),
        tagsStr,
        stackStr,
        category,
      }
      try {
        localStorage.setItem('fiche_draft', JSON.stringify(draft))
      } catch (err) {
        console.error('Erreur sauvegarde fiche_draft:', err)
      }

      // b. Ouvrir la modale d'invitation à se connecter
      setShowAuthModal(true)
      return
    }

    setPublishing(true)
    setError(null)

    try {
      const tags = tagsStr
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)

      const stack = stackStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      const insertPayload: Record<string, unknown> = {
        author_id: userId,
        title: title.trim(),
        problem: problem.trim(),
        solution: solution.trim(),
        original_question: rawQuestion.trim(),
        tags,
        stack,
        category,
      }

      let { error: insertError } = await supabase.from('fiches').insert(insertPayload)

      if (insertError && (insertError.message?.includes('category') || insertError.code === '42703')) {
        delete insertPayload.category
        const retry = await supabase.from('fiches').insert(insertPayload)
        insertError = retry.error
      }

      if (insertError) {
        throw new Error(insertError.message)
      }

      router.push('/dashboard?success=published')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la publication'
      setError(msg)
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* En-tête de section */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Créer une nouvelle fiche
          </h1>
          <p className="text-sm text-muted mt-1">
            Transformez un échange WhatsApp ou forum en documentation durable.
          </p>
        </div>
        <Link
          href={userId ? '/dashboard' : '/'}
          className="text-sm font-medium text-muted hover:text-foreground transition-colors"
        >
          {userId ? '← Retour au dashboard' : '← Retour à l\'accueil'}
        </Link>
      </div>

      {restoredToast && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm rounded-md shadow-xs flex items-center gap-2.5 animate-in fade-in">
          <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>✨ Brouillon restauré automatiquement ! Vous pouvez vérifier et publier votre fiche.</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md shadow-sm">
          {error}
        </div>
      )}

      {/* Formulaire de saisie brute */}
      <form
        onSubmit={handleGenerate}
        className="bg-card p-6 sm:p-8 border border-border rounded-md shadow-sm space-y-5"
      >
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">
            Question brute
          </label>
          <textarea
            value={rawQuestion}
            onChange={(e) => setRawQuestion(e.target.value)}
            rows={4}
            placeholder="Collez ici la question technique posée sur WhatsApp ou Facebook..."
            className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">
            Réponse brute
          </label>
          <textarea
            value={rawAnswer}
            onChange={(e) => setRawAnswer(e.target.value)}
            rows={5}
            placeholder="Collez ici la réponse apportée dans la discussion..."
            className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
            required
          />
        </div>

        {/* Encart Confidentialité / PII Redaction */}
        <div className="flex items-center gap-2 p-2.5 bg-muted/20 border border-border/80 rounded-md text-xs text-muted">
          <Shield className="w-4 h-4 text-accent shrink-0" />
          <span>🔒 Confidentialité garantie : L'IA anonymise automatiquement les numéros de téléphone et les noms avant la publication.</span>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-accent text-white px-5 py-2.5 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all shadow-sm inline-flex items-center gap-2"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{loading ? 'Génération par Gemini en cours...' : 'Générer la fiche'}</span>
          </button>
        </div>
      </form>

      {/* Formulaire d'édition pré-rempli par Gemini */}
      {hasGenerated && (
        <form
          onSubmit={handlePublish}
          id="generated-fiche-form"
          className="bg-card p-6 sm:p-8 border border-border rounded-md shadow-sm space-y-5"
        >
          <div className="pb-3 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              Fiche structurée proposée par l'IA
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Vous pouvez réviser et enrichir les champs avant publication.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-sm font-medium text-foreground">
                Titre
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground flex items-center justify-between">
                <span>Catégorie</span>
                <span className="text-xs text-muted font-normal">Savoir ciblé</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                aria-label="Sélectionner la catégorie"
                className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm font-medium"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Problème
            </label>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              rows={4}
              className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Solution
            </label>
            <textarea
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              rows={6}
              className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Tags (séparés par des virgules)
            </label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="react, css, git"
              className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Technologies / Stack (séparées par des virgules)
            </label>
            <input
              type="text"
              value={stackStr}
              onChange={(e) => setStackStr(e.target.value)}
              placeholder="Next.js, Tailwind, Python"
              className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={publishing}
              className="bg-foreground text-background px-5 py-2.5 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all shadow-sm inline-flex items-center gap-2"
            >
              {publishing && (
                <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              )}
              <span>{publishing ? 'Publication en cours...' : 'Publier la fiche'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Modale d'invitation à se connecter pour visiteur anonyme */}
      {showAuthModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-accent-light border border-accent/20 flex items-center justify-center text-accent mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold tracking-tight text-foreground">
                Connexion requise
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                Connecte-toi pour publier ta fiche et signer ton travail. Ton brouillon est sauvegardé.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/login?redirect=/create&message=Connecte-toi+pour+publier+ta+fiche+et+signer+ton+travail.+Ton+brouillon+est+sauvegardé."
                className="flex-1 bg-accent hover:opacity-90 text-white text-center py-2.5 px-4 rounded-md text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Se connecter</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="border border-border bg-card hover:bg-background text-foreground text-center py-2.5 px-4 rounded-md text-sm font-medium transition-colors cursor-pointer"
              >
                Continuer l'édition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
