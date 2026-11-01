'use client'

import { ThumbsUp, Eye, FileText, CheckCircle2 } from 'lucide-react'

export interface ImpactStatsData {
  totalFiches: number
  totalUseful: number
  totalViews: number
  savedCount?: number
}

interface ImpactStatsProps {
  stats: ImpactStatsData
}

/**
 * Système de Reconnaissance Ouverte basé sur l'impact réel et vérifié en production.
 * Remplace l'ancien système de badges artificiels.
 */
export default function ImpactStats({ stats }: ImpactStatsProps) {
  const { totalFiches, totalUseful, totalViews } = stats

  const metrics = [
    {
      id: 'useful',
      title: 'Utilisé en production',
      value: totalUseful,
      unit: totalUseful > 1 ? 'résolutions validées' : 'résolution validée',
      description: 'Nombre total de votes « Utile » reçus, confirmant qu’un problème a été résolu en production.',
      icon: ThumbsUp,
      status: 'Impact vérifié',
      statusClass: 'text-accent bg-accent-light border-accent/30',
    },
    {
      id: 'views',
      title: 'Portée communautaire',
      value: totalViews,
      unit: totalViews > 1 ? 'vues cumulées' : 'vue cumulée',
      description: 'Volume total de consultations générées sur l’ensemble de vos fiches techniques.',
      icon: Eye,
      status: 'Portée active',
      statusClass: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    },
    {
      id: 'fiches',
      title: 'Contribution active',
      value: totalFiches,
      unit: totalFiches > 1 ? 'fiches publiées' : 'fiche publiée',
      description: 'Volume total de savoir technique documenté et capitalisé pour la communauté.',
      icon: FileText,
      status: 'Capitalisé',
      statusClass: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    },
  ]

  return (
    <div className="space-y-6" id="open-recognition-section">
      {/* En-tête Reconnaissance Ouverte */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-hairline">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
            <h3 className="text-base font-semibold text-text-primary">
              Reconnaissance Ouverte · Impact Réel
            </h3>
          </div>
          <p className="text-xs text-text-secondary">
            Métriques d'impact factuelles et vérifiées. Aucune gamification artificielle.
          </p>
        </div>
        <span className="self-start sm:self-auto text-[11px] font-mono text-accent bg-accent-light border border-accent/30 px-2.5 py-1 rounded-full font-medium">
          Proof-of-Work
        </span>
      </div>

      {/* Grille des 3 métriques d'impact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <div
              key={metric.id}
              className="bg-surface-raised border border-border-hairline rounded-lg p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    {metric.title}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${metric.statusClass}`}
                  >
                    {metric.status}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-text-primary">
                    {metric.value}
                  </span>
                  <span className="text-xs text-text-muted">{metric.unit}</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {metric.description}
                </p>
              </div>

              <div className="pt-3 border-t border-border-hairline/80 flex items-center justify-between text-xs text-text-muted">
                <span className="inline-flex items-center gap-1.5 text-text-secondary">
                  <Icon className="w-3.5 h-3.5 text-accent" />
                  <span>Métrique vérifiée</span>
                </span>
                <span className="font-mono text-[10px]">Impact réel</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
