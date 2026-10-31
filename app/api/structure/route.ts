import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ai } from '@/lib/gemini'

const STRUCTURE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Titre court et clair de la fiche (max 80 caractères)' },
    problem: { type: 'string', description: 'Le problème reformulé de manière générale et compréhensible' },
    solution: { type: 'string', description: 'La solution technique expliquée clairement, étape par étape si besoin' },
    tags: { type: 'array', items: { type: 'string' }, description: '3 à 5 mots-clés en minuscules (ex: react, css, git)' },
    stack: { type: 'array', items: { type: 'string' }, description: 'Les technologies concernées (ex: Next.js, Tailwind, Python)' }
  },
  required: ['title', 'problem', 'solution', 'tags', 'stack']
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { rawQuestion, rawAnswer } = body

    if (!rawQuestion || !rawAnswer) {
      return NextResponse.json(
        { error: 'Question et réponse brutes requises' },
        { status: 400 }
      )
    }

    const prompt = `Tu es un assistant qui transforme des échanges techniques bruts (questions/réponses issues de groupes WhatsApp) en fiches de connaissance structurées.
Tu dois extraire l'essentiel de la question et de la réponse.
Réponds UNIQUEMENT en JSON valide selon le schéma fourni.

Question brute :
${rawQuestion}

Réponse brute :
${rawAnswer}`

    const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.8-flash']
    let lastError: unknown = null
    let outputText: string | null | undefined = null

    for (const model of modelsToTry) {
      try {
        const interaction = await ai.interactions.create({
          model,
          input: prompt,
          response_format: {
            type: 'text',
            mime_type: 'application/json',
            schema: STRUCTURE_SCHEMA,
          },
        })
        outputText = interaction.output_text
        if (outputText) break
      } catch (err: unknown) {
        lastError = err
        continue
      }
    }

    if (!outputText) {
      throw lastError || new Error('Aucune réponse générée par Gemini')
    }

    const structuredData = JSON.parse(outputText)
    return NextResponse.json(structuredData)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    console.error('Erreur API /api/structure:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
