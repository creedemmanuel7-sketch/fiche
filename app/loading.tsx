import Header from '@/components/Header'
import { SkeletonGrid } from '@/components/SkeletonCard'

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header user={null} />

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-10 space-y-10">
        {/* En-tête / Hero Squelette */}
        <div className="space-y-4 max-w-2xl animate-pulse">
          <div className="h-9 w-64 bg-muted/20 dark:bg-muted/30 rounded-md" />
          <div className="h-4 w-96 bg-muted/20 dark:bg-muted/30 rounded" />
        </div>

        {/* Barre de recherche squelette */}
        <div className="h-12 w-full bg-card border border-border rounded-lg animate-pulse" />

        {/* Grille de 6 SkeletonCards */}
        <section className="space-y-4">
          <div className="h-5 w-40 bg-muted/20 dark:bg-muted/30 rounded animate-pulse" />
          <SkeletonGrid count={6} />
        </section>
      </main>
    </div>
  )
}
