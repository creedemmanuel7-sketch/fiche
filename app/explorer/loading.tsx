import Header from '@/components/Header'
import { SkeletonGrid } from '@/components/SkeletonCard'

export default function ExplorerLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header user={null} />

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-10 space-y-10">
        <div className="space-y-4 max-w-2xl animate-pulse">
          <div className="h-9 w-52 bg-muted/20 dark:bg-muted/30 rounded-md" />
          <div className="h-4 w-80 bg-muted/20 dark:bg-muted/30 rounded" />
        </div>

        <div className="h-12 w-full bg-card border border-border rounded-lg animate-pulse" />

        <section className="space-y-4">
          <div className="h-5 w-36 bg-muted/20 dark:bg-muted/30 rounded animate-pulse" />
          <SkeletonGrid count={6} />
        </section>
      </main>
    </div>
  )
}
