import Link from 'next/link'
import Logo from './Logo'

interface HeaderProps {
  user?: { email?: string | null } | null
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
          <Logo />
        </Link>
        <nav className="flex items-center gap-5">
          <Link
            href="/"
            className="text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            Explorer
          </Link>
          {user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/create"
                className="bg-foreground text-white hover:bg-black/85 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm"
              >
                Créer une fiche
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-foreground text-white hover:bg-black/85 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm"
            >
              Se connecter
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
