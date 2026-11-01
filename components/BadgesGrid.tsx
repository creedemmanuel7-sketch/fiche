'use client'

import {
  Flag,
  Hammer,
  Award,
  TrendingUp,
  Bookmark,
  Lock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

export interface BadgesStats {
  totalFiches: number
  totalUseful: number
  totalViews: number
  savedCount: number
}

interface BadgesGridProps {
  stats: BadgesStats
}

interface BadgeItem {
  id: string
  name: string
  description: string
  howToUnlock: string
  isUnlocked: boolean
  progressText: string
  icon: typeof Flag
}

export default function BadgesGrid({ stats }: BadgesGridProps) {
  const { totalFiches, totalUseful, totalViews, savedCount } = stats

  const badges: BadgeItem[] = [
    {
      id: 'pioneer',
      name: 'Le Pionnier',
      description: 'A publié au moins 1 fiche',
      howToUnlock: 'Publier votre première fiche technique sur la plateforme',
      isUnlocked: totalFiches >= 1,
      progressText: `${Math.min(totalFiches, 1)} / 1`,
      icon: Flag,
    },
    {
      id: 'builder',
      name: 'Le Bâtisseur',
      description: 'A publié au moins 5 fiches',
      howToUnlock: 'Publier au moins 5 fiches pour consolider la base de savoir',
      isUnlocked: totalFiches >= 5,
      progressText: `${Math.min(totalFiches, 5)} / 5`,
      icon: Hammer,
    },
    {
      id: 'reference',
      name: 'La Référence',
      description: 'A reçu au total au moins 10 votes « Utile »',
      howToUnlock: 'Cumuler 10 votes Utile de la communauté sur vos fiches',
      isUnlocked: totalUseful >= 10,
      progressText: `${Math.min(totalUseful, 10)} / 10`,
      icon: Award,
    },
    {
      id: 'influencer',
      name: "L'Influenceur",
      description: 'A généré au total au moins 100 vues',
      howToUnlock: 'Atteindre un total de 100 vues cumulées sur vos contributions',
      isUnlocked: totalViews >= 100,
      progressText: `${Math.min(totalViews, 100)} / 100`,
      icon: TrendingUp,
    },
    {
      id: 'curator',
      name: 'Le Curateur',
      description: 'A sauvegardé au moins 3 fiches en favoris',
      howToUnlock: 'Sauvegarder au moins 3 fiches pour votre usage personnel',
      isUnlocked: savedCount >= 3,
      progressText: `${Math.min(savedCount, 3)} / 3`,
      icon: Bookmark,
    },
  ]

  const unlockedCount = badges.filter((b) => b.isUnlocked).length

  return (
    <div className="space-y-4">
      {/* En-tête de section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">
            Succès & Récompenses de contribution
          </h3>
        </div>
        <span className="text-xs font-medium text-muted bg-card px-2.5 py-1 rounded-full border border-border">
          {unlockedCount} sur {badges.length} débloqué{unlockedCount > 1 ? 's' : ''}
        </span>
      </div>

      {/* Grille de 5 badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {badges.map((badge) => {
          const Icon = badge.icon

          return (
            <div
              key={badge.id}
              title={`Objectif : ${badge.howToUnlock} (${badge.isUnlocked ? 'Débloqué !' : 'En cours'})`}
              className={`rounded-xl p-4 flex flex-col justify-between transition-all relative select-none border ${
                badge.isUnlocked
                  ? 'bg-accent-light/30 border-accent/40 shadow-xs hover:border-accent'
                  : 'bg-gray-100/80 dark:bg-zinc-900/50 border-border/80 opacity-60 hover:opacity-85'
              }`}
            >
              {/* Cadenas ou checkmark discret en haut à droite */}
              <div className="absolute top-3.5 right-3.5">
                {badge.isUnlocked ? (
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-muted" />
                )}
              </div>

              {/* Icône du badge */}
              <div className="space-y-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    badge.isUnlocked
                      ? 'bg-accent-light text-accent'
                      : 'bg-card border border-border text-muted'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Titre & Description */}
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground leading-snug">
                    {badge.name}
                  </h4>
                  <p className="text-xs text-muted leading-tight line-clamp-2">
                    {badge.description}
                  </p>
                </div>
              </div>

              {/* État / Progression au bas de la carte */}
              <div className="pt-3 mt-3 border-t border-border/40 flex items-center justify-between text-[11px]">
                <span
                  className={`font-semibold ${
                    badge.isUnlocked ? 'text-accent' : 'text-muted'
                  }`}
                >
                  {badge.isUnlocked ? 'Débloqué' : 'Verrouillé'}
                </span>
                <span className="font-mono text-muted text-[10px]">
                  {badge.progressText}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
