'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ThumbsUp, Eye, Bookmark } from 'lucide-react'

export interface PublicFiche {
  id: string
  title: string
  problem?: string
  solution?: string
  category?: string
  tags: string[]
  stack: string[]
  author_id: string
  author_name?: string
  author_linkedin_url?: string | null
  view_count: number
  useful_count: number
  created_at: string
}

export function resolveCategory(fiche: {
  category?: string
  title?: string
  tags?: string[]
  stack?: string[]
  original_question?: string | null
}): string {
  if (
    fiche.category &&
    ['Code', 'Carrière', 'Méthodo', 'Contexte Local', 'Soft Skills'].includes(fiche.category)
  ) {
    return fiche.category
  }
  const fullText = [
    fiche.title || '',
    ...(fiche.tags || []),
    ...(fiche.stack || []),
    fiche.original_question || '',
  ]
    .join(' ')
    .toLowerCase()

  if (
    fullText.includes('mobile money') ||
    fullText.includes('cinetpay') ||
    fullText.includes('togo') ||
    fullText.includes('lomé') ||
    fullText.includes('lome')
  ) {
    if (fullText.includes('salaire') || fullText.includes('junior')) {
      return 'Carrière'
    }
    return 'Contexte Local'
  }
  if (
    fullText.includes('salaire') ||
    fullText.includes('negociation') ||
    fullText.includes('recrutement') ||
    fullText.includes('github') ||
    fullText.includes('carriere')
  ) {
    return 'Carrière'
  }
  if (
    fullText.includes('périmètre') ||
    fullText.includes('perimetre') ||
    fullText.includes('gestion de projet') ||
    fullText.includes('trello') ||
    fullText.includes('contrat') ||
    fullText.includes('agile')
  ) {
    return 'Méthodo'
  }
  if (
    fullText.includes('management') ||
    fullText.includes('équipe') ||
    fullText.includes('equipe') ||
    fullText.includes('mentorat') ||
    fullText.includes('soft skills')
  ) {
    return 'Soft Skills'
  }
  return 'Code'
}

export function getCategoryBadgeClass(category?: string) {
  switch (category) {
    case 'Carrière':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
    case 'Contexte Local':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
    case 'Méthodo':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
    case 'Soft Skills':
      return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30'
    case 'Code':
    default:
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
  }
}

interface FicheCardProps {
  fiche: PublicFiche
  isSaved: boolean
  onToggleFavorite: (e: React.MouseEvent, ficheId: string) => void
}

export default function FicheCard({ fiche, isSaved, onToggleFavorite }: FicheCardProps) {
  const category = resolveCategory(fiche)
  const dateFormatted = new Date(fiche.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="bg-card border border-border hover:border-accent/40 hover:shadow-md rounded-lg p-5 flex flex-col justify-between space-y-4 transition-all group relative cursor-pointer"
    >
      <div className="space-y-2.5">
        {/* En-tête de carte : Catégorie + Auteur + Date + Signet Bookmark */}
        <div className="flex items-center justify-between gap-2 text-xs text-muted">
          <div className="flex items-center gap-2 min-w-0 truncate">
            <span
              className={`inline-flex items-center text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${getCategoryBadgeClass(
                category
              )}`}
            >
              {category}
            </span>
            <span className="truncate">Par {fiche.author_name || 'Équipe Fiche'} • {dateFormatted}</span>
          </div>
          <button
            type="button"
            onClick={(e) => onToggleFavorite(e, fiche.id)}
            title={isSaved ? 'Retirer des favoris' : 'Sauvegarder la fiche'}
            className={`p-1.5 rounded-md transition-colors shrink-0 ${
              isSaved
                ? 'text-accent bg-accent-light'
                : 'text-muted hover:text-foreground hover:bg-background'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Titre (limité à 2 lignes) */}
        <Link href={`/fiche/${fiche.id}`} className="block">
          <h2 className="text-base font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug">
            {fiche.title}
          </h2>
        </Link>

        {/* Badges Stack & Tags */}
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
          {fiche.stack &&
            fiche.stack.slice(0, 2).map((item, idx) => (
              <span
                key={`stack-${idx}`}
                className="bg-accent-light text-accent text-[11px] px-2 py-0.5 rounded-full font-medium"
              >
                {item}
              </span>
            ))}
        </div>
      </div>

      {/* Footer de carte compact : Vues et Votes Utiles */}
      <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <ThumbsUp className="w-3.5 h-3.5 text-accent" />
          <span>{fiche.useful_count || 0} utile</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <Eye className="w-3.5 h-3.5 text-muted" />
          <span>{fiche.view_count || 0} vue{fiche.view_count > 1 ? 's' : ''}</span>
        </span>
      </div>
    </motion.div>
  )
}
