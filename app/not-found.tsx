import Link from 'next/link'
import Header from '@/components/Header'
import { SearchX, Home, Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 min-h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto space-y-6">
        {/* Grande icône SearchX */}
        <div className="w-16 h-16 rounded-2xl bg-accent-light flex items-center justify-center text-accent shadow-xs animate-in fade-in zoom-in-90 duration-300">
          <SearchX className="w-8 h-8" />
        </div>

        {/* Titre 404 Énorme & Sous-titre */}
        <div className="space-y-2">
          <h1 className="text-7xl sm:text-8xl font-black tracking-tight text-foreground">
            404
          </h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
            Cette fiche est introuvable.
          </h2>
        </div>

        {/* Texte explicatif avec blague dev */}
        <p className="text-sm text-muted leading-relaxed max-w-md mx-auto">
          Elle a probablement été perdue dans un{' '}
          <code className="bg-card border border-border px-1.5 py-0.5 rounded text-accent font-mono text-xs">
            node_modules
          </code>{' '}
          ou supprimée par un{' '}
          <code className="bg-card border border-border px-1.5 py-0.5 rounded text-accent font-mono text-xs">
            rm -rf
          </code>
          . Ne paniquez pas, même les meilleurs font des erreurs de routing.
        </p>

        {/* Faux terminal avec curseur clignotant */}
        <div className="w-full bg-card border border-border rounded-lg p-4 font-mono text-xs text-left shadow-xs space-y-2">
          <div className="flex items-center gap-1.5 pb-2 border-b border-border/60">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
            <span className="text-[11px] text-muted ml-2">bash — terminal</span>
          </div>
          <p className="text-foreground">
            <span className="text-accent font-semibold">$</span> find / -name &quot;fiche&quot; -type f
            <span className="inline-block w-1.5 h-3.5 bg-accent ml-1.5 animate-pulse align-middle" />
          </p>
          <p className="text-muted">[0 results]</p>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-foreground text-background hover:opacity-90 px-6 py-2.5 rounded-md text-sm font-semibold transition-all shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Retour à l&apos;accueil</span>
          </Link>
          <Link
            href="/explorer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-card hover:bg-background border border-border text-foreground px-6 py-2.5 rounded-md text-sm font-semibold transition-all shadow-xs hover:border-gray-400 dark:hover:border-gray-600"
          >
            <Compass className="w-4 h-4 text-accent" />
            <span>Chercher une autre fiche</span>
          </Link>
        </div>
      </main>
    </div>
  )
}
