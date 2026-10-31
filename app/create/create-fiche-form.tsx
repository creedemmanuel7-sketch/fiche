'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface StructuredData {
  title: string
  problem: string
  solution: string
  tags: string[]
  stack: string[]
}

export default function CreateFicheForm({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()

  // Raw inputs
  const [rawQuestion, setRawQuestion] = useState('')
  const [rawAnswer, setRawAnswer] = useState('')

  // State
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generated / editable fields
  const [hasGenerated, setHasGenerated] = useState(false)
  const [title, setTitle] = useState('')
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')
  const [tagsStr, setTagsStr] = useState('')
  const [stackStr, setStackStr] = useState('')

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

      const { error: insertError } = await supabase.from('fiches').insert({
        author_id: userId,
        title: title.trim(),
        problem: problem.trim(),
        solution: solution.trim(),
        original_question: rawQuestion.trim(),
        tags,
        stack,
      })

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
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5]">
        <h1 className="text-xl font-bold tracking-tight text-[#1A1A1A]">
          Créer une nouvelle fiche
        </h1>
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-black transition-colors"
        >
          Retour au dashboard
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      {/* Formulaire de saisie brute */}
      <form onSubmit={handleGenerate} className="bg-white p-6 border border-[#E5E5E5] rounded space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
            Question brute
          </label>
          <textarea
            value={rawQuestion}
            onChange={(e) => setRawQuestion(e.target.value)}
            rows={4}
            placeholder="Collez ici la question technique posée sur WhatsApp ou Facebook..."
            className="w-full border border-[#E5E5E5] p-3 rounded text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-black"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
            Réponse brute
          </label>
          <textarea
            value={rawAnswer}
            onChange={(e) => setRawAnswer(e.target.value)}
            rows={5}
            placeholder="Collez ici la réponse apportée dans la discussion..."
            className="w-full border border-[#E5E5E5] p-3 rounded text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-black"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-5 py-2.5 rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Génération par Gemini en cours...' : 'Générer la fiche'}
        </button>
      </form>

      {/* Formulaire d'édition pré-rempli par Gemini */}
      {hasGenerated && (
        <form
          onSubmit={handlePublish}
          id="generated-fiche-form"
          className="bg-white p-6 border border-[#E5E5E5] rounded space-y-5"
        >
          <h2 className="text-lg font-semibold text-[#1A1A1A] pb-2 border-b border-[#E5E5E5]">
            Fiche structurée proposée par l'IA
          </h2>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Titre
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-[#E5E5E5] p-2.5 rounded text-sm text-[#1A1A1A] focus:outline-none focus:border-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Problème
            </label>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              rows={4}
              className="w-full border border-[#E5E5E5] p-2.5 rounded text-sm text-[#1A1A1A] focus:outline-none focus:border-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Solution
            </label>
            <textarea
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              rows={6}
              className="w-full border border-[#E5E5E5] p-2.5 rounded text-sm text-[#1A1A1A] focus:outline-none focus:border-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Tags (séparés par des virgules)
            </label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="react, css, git"
              className="w-full border border-[#E5E5E5] p-2.5 rounded text-sm text-[#1A1A1A] focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Technologies / Stack (séparées par des virgules)
            </label>
            <input
              type="text"
              value={stackStr}
              onChange={(e) => setStackStr(e.target.value)}
              placeholder="Next.js, Tailwind, Python"
              className="w-full border border-[#E5E5E5] p-2.5 rounded text-sm text-[#1A1A1A] focus:outline-none focus:border-black"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={publishing}
              className="bg-black text-white px-5 py-2.5 rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {publishing ? 'Publication en cours...' : 'Publier la fiche'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
