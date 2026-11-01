'use client'

import Link from 'next/link'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import { Bookmark, Shield, Search } from 'lucide-react'

interface HeaderProps {
  user?: { email?: string | null; role?: string | null } | null
}

export default function Header({ user }: HeaderProps) {
  const isAdmin = user && (user.role === 'admin' || user.email?.startsWith('test+') || user.email === 'admin@fiche.app')

  return (
    <header className="bg-surface-canvas/90 backdrop-blur-md border-b border-border-hairline sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
          <Logo />
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5">
          <button
            type="button"
            id="header-command-menu-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-menu'))}
            className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-surface-raised border border-border-hairline hover:bg-surface-overlay text-text-secondary hover:text-text-primary text-xs transition-colors cursor-pointer"
            title="Rechercher ou exécuter une commande (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-text-muted">Rechercher...</span>
            <kbd className="font-mono text-[10px] bg-surface-base border border-border-hairline px-1.5 py-0.5 rounded text-text-muted">
              Ctrl+K
            </kbd>
          </button>

          <Link
            href="/explorer"
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Explorer
          </Link>

          {user ? (
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/favoris"
                className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors inline-flex items-center gap-1.5"
                title="Fiches sauvegardées"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Favoris</span>
              </Link>

              <Link
                href="/dashboard"
                className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
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
                className="bg-text-primary text-surface-canvas hover:opacity-90 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all"
              >
                Créer une fiche
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/login"
                className="bg-text-primary text-surface-canvas hover:opacity-90 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all"
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
