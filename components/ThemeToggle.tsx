'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

interface ThemeToggleProps {
  showLabel?: boolean
  className?: string
}

export default function ThemeToggle({ showLabel, className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    if (showLabel) {
      return (
        <div
          className={`w-full h-11 rounded-md border border-border-hairline bg-surface-raised animate-pulse ${className || ''}`}
          aria-hidden="true"
        />
      )
    }
    return (
      <div
        className={`w-8 h-8 rounded-md border border-border-hairline bg-surface-raised animate-pulse ${className || ''}`}
        aria-hidden="true"
      />
    )
  }

  const currentTheme = theme || resolvedTheme
  const isDark = currentTheme === 'dark'

  const toggle = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  if (showLabel) {
    return (
      <button
        type="button"
        id="theme-toggle-mobile-btn"
        onClick={toggle}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md bg-surface-raised border border-border-hairline text-text-primary text-xs font-medium hover:bg-surface-overlay transition-colors min-h-[44px] cursor-pointer ${className || ''}`}
        aria-label={isDark ? 'Passer au mode clair' : 'Passer au mode sombre'}
      >
        <div className="flex items-center gap-2.5">
          {isDark ? (
            <svg
              className="w-4 h-4 text-amber-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 text-indigo-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
          <span>Mode {isDark ? 'Sombre' : 'Clair'}</span>
        </div>
        <span className="text-[11px] text-text-muted">Basculer</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      id="theme-toggle-btn"
      onClick={toggle}
      className={`p-1.5 rounded-md border border-border-hairline bg-surface-raised hover:bg-surface-overlay text-text-secondary hover:text-text-primary transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center ${className || ''}`}
      aria-label={isDark ? 'Passer au mode clair' : 'Passer au mode sombre'}
      title={isDark ? 'Passer au mode clair' : 'Passer au mode sombre'}
    >
      {isDark ? (
        // Soleil (pour repasser en clair)
        <svg
          className="w-4 h-4 text-amber-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // Lune (pour passer en sombre)
        <svg
          className="w-4 h-4 text-indigo-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  )
}
