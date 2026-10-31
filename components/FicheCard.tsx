'use client'

import Link from 'next/link'
import { ThumbsUp, Eye, Bookmark } from 'lucide-react'

export interface PublicFiche {
  id: string
  title: string
  problem?: string
  solution?: string
  tags: string[]
  stack: string[]
  author_id: string
  author_name?: string
  view_count: number
  useful_count: number
  created_at: string
}

interface FicheCardProps {
  fiche: PublicFiche
  isSaved: boolean
  onToggleFavorite: (e: React.MouseEvent, ficheId: string) => void
}

export default function FicheCard({ fiche, isSaved, onToggleFavorite }: FicheCardProps) {
  const dateFormatted = new Date(fiche.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="bg-card border border-border hover:border-gray-400 dark:hover:border-gray-600 rounded-lg p-5 flex flex-col justify-between space-y-4 transition-all shadow-sm group relative">
      <div className="space-y-2.5">
        {/* En-tête de carte : Auteur + Date + Signet Bookmark */}
        <div className="flex items-center justify-between gap-2 text-xs text-muted">
          <span className="truncate">Par {fiche.author_name || 'Senior'} • {dateFormatted}</span>
          <button
            type="button"
            onClick={(e) => onToggleFavorite(e, fiche.id)}
            title={isSaved ? 'Retirer des favoris' : 'Sauvegarder la fiche'}
            className={`p-1.5 rounded-md transition-colors ${
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
    </div>
  )
}
