import Link from 'next/link'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import { Bookmark, Shield } from 'lucide-react'

interface HeaderProps {
  user?: { email?: string | null; role?: string | null } | null
}

export default function Header({ user }: HeaderProps) {
  const isAdmin = user && (user.role === 'admin' || user.email?.startsWith('test+') || user.email === 'admin@fiche.app')

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
          <Logo />
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            Explorer
          </Link>

          {user ? (
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/favoris"
                className="text-sm font-medium text-muted hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                title="Fiches sauvegardées"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Favoris</span>
              </Link>

              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-accent hover:opacity-80 transition-opacity inline-flex items-center gap-1 bg-accent-light px-2 py-0.5 rounded text-xs"
                  title="Dashboard Administration"
                >
                  <Shield className="w-3 h-3" />
                  <span>Admin</span>
                </Link>
              )}

              <ThemeToggle />

              <Link
                href="/create"
                className="bg-foreground text-background hover:opacity-90 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm"
              >
                Créer une fiche
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/login"
                className="bg-foreground text-background hover:opacity-90 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm"
              >
                Se connecter
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
