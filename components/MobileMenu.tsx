'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import ThemeToggle from './ThemeToggle'
import {
  X,
  Compass,
  Bookmark,
  LayoutDashboard,
  Shield,
  PlusCircle,
  Search,
  LogIn,
} from 'lucide-react'
import Logo from './Logo'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  user?: { email?: string | null; role?: string | null } | null
}

export default function MobileMenu({ isOpen, onClose, user }: MobileMenuProps) {
  const isAdmin =
    user &&
    (user.role === 'admin' ||
      user.email?.startsWith('test+') ||
      user.email === 'admin@fiche.app')

  // Bloquer le scroll du body quand le menu mobile est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleOpenSearch = () => {
    onClose()
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-command-menu'))
    }, 150)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end" id="mobile-navigation-drawer">
          {/* Backdrop avec flou */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-surface-canvas/80 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Tiroir latéral (Surface 3 Overlay, 1px Hairline) */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-xs h-full bg-surface-overlay border-l border-border-hairline p-6 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto"
          >
            {/* Haut du menu */}
            <div className="space-y-6">
              {/* En-tête : Logo + Bouton Fermer */}
              <div className="flex items-center justify-between pb-4 border-b border-border-hairline">
                <Link href="/" onClick={onClose} className="inline-block">
                  <Logo />
                </Link>
                <button
                  type="button"
                  id="mobile-menu-close-btn"
                  onClick={onClose}
                  aria-label="Fermer le menu"
                  className="p-2 rounded-md bg-surface-raised border border-border-hairline text-text-muted hover:text-text-primary transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Bouton Recherche rapide (Ctrl+K) */}
              <button
                type="button"
                id="mobile-menu-search-btn"
                onClick={handleOpenSearch}
                className="w-full flex items-center justify-between px-3.5 py-3 rounded-md bg-surface-raised border border-border-hairline text-text-secondary hover:text-text-primary text-sm transition-colors cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-text-muted" />
                  <span>Rechercher...</span>
                </div>
                <kbd className="font-mono text-[10px] bg-surface-base border border-border-hairline px-1.5 py-0.5 rounded text-text-muted">
                  Ctrl+K
                </kbd>
              </button>

              {/* Liens de navigation */}
              <nav className="space-y-1 text-sm font-medium">
                <Link
                  href="/explorer"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-3 rounded-md text-text-primary hover:bg-surface-raised transition-colors min-h-[44px]"
                >
                  <Compass className="w-4 h-4 text-text-muted" />
                  <span>Explorer les fiches</span>
                </Link>

                {user ? (
                  <>
                    <Link
                      href="/favoris"
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-3 rounded-md text-text-primary hover:bg-surface-raised transition-colors min-h-[44px]"
                    >
                      <Bookmark className="w-4 h-4 text-text-muted" />
                      <span>Favoris sauvegardés</span>
                    </Link>

                    <Link
                      href="/dashboard"
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-3 rounded-md text-text-primary hover:bg-surface-raised transition-colors min-h-[44px]"
                    >
                      <LayoutDashboard className="w-4 h-4 text-text-muted" />
                      <span>Tableau de bord</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={onClose}
                        className="flex items-center gap-3 px-3 py-3 rounded-md text-accent hover:bg-surface-raised transition-colors min-h-[44px]"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Administration</span>
                      </Link>
                    )}
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-3 rounded-md text-text-primary hover:bg-surface-raised transition-colors min-h-[44px]"
                  >
                    <LogIn className="w-4 h-4 text-text-muted" />
                    <span>Se connecter / S'inscrire</span>
                  </Link>
                )}
              </nav>

              {/* Bouton Créer une fiche */}
              <div className="pt-2">
                <Link
                  href="/create"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 bg-text-primary text-surface-canvas py-3 px-4 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity min-h-[44px]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Créer une fiche</span>
                </Link>
              </div>
            </div>

            {/* Bas du menu : Basculement de Thème + Email */}
            <div className="pt-6 border-t border-border-hairline space-y-3">
              <ThemeToggle showLabel />

              {user?.email && (
                <div className="text-[11px] text-text-muted truncate px-1">
                  Connecté en tant que <span className="text-text-secondary">{user.email}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
