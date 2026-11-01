import * as React from 'react'

export function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex flex-col justify-between space-y-4 shadow-sm animate-pulse">
      <div className="space-y-3">
        {/* En-tête : catégorie + auteur */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-4.5 w-16 bg-gray-200 dark:bg-gray-800 rounded-full" />
            <div className="h-3.5 w-28 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>

        {/* Titre (2 lignes) */}
        <div className="space-y-2 pt-1">
          <div className="h-4.5 w-5/6 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-4.5 w-3/5 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>

        {/* Badges Tags */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          <div className="h-4.5 w-14 bg-gray-200 dark:bg-gray-800 rounded-full" />
          <div className="h-4.5 w-16 bg-gray-200 dark:bg-gray-800 rounded-full" />
          <div className="h-4.5 w-12 bg-gray-200 dark:bg-gray-800 rounded-full" />
        </div>
      </div>

      {/* Footer : Utile et Vues */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="h-3.5 w-14 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-3.5 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export default SkeletonCard
