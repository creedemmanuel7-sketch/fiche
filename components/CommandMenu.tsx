'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import {
  PlusCircle,
  Compass,
  LayoutDashboard,
  Sun,
  Moon,
  Search,
  FileText,
  CornerDownLeft,
} from 'lucide-react'

interface FicheSearchItem {
  id: string
  title: string
  category?: string
  tags?: string[]
}

export default function CommandMenu() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [fiches, setFiches] = useState<FicheSearchItem[]>([])
  const [loadingFiches, setLoadingFiches] = useState(false)

  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const supabase = createClient()

  // Écoute globale de la combinaison de touches Ctrl+K / Cmd+K et de l'événement personnalisé
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    const handleCustomOpen = () => setOpen(true)

    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-command-menu', handleCustomOpen)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-command-menu', handleCustomOpen)
    }
  }, [])

  // Récupération des fiches en temps réel depuis Supabase à l'ouverture
  useEffect(() => {
    if (!open) return

    let isMounted = true
    setLoadingFiches(true)

    supabase
      .from('fiches')
      .select('id, title, category, tags')
      .order('created_at', { ascending: false })
      .limit(25)
      .then(({ data, error }) => {
        if (!isMounted) return
        if (!error && data) {
          setFiches(data as FicheSearchItem[])
        }
        setLoadingFiches(false)
      })

    return () => {
      isMounted = false
    }
  }, [open, supabase])

  const runCommand = (command: () => void) => {
    setOpen(false)
    setSearch('')
    command()
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Palette de commandes universelle"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4"
    >
      {/* Overlay avec flou d'arrière-plan */}
      <div
        className="fixed inset-0 bg-surface-canvas/70 backdrop-blur-2xl -z-10 animate-in fade-in duration-200"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Conteneur principal de la palette (Surface 3 Overlay, 1px Hairline) */}
      <div className="bg-surface-overlay border border-border-hairline rounded-xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Champ de recherche Command.Input */}
        <div className="flex items-center px-4 border-b border-border-hairline gap-3">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Rechercher une commande ou une fiche..."
            className="w-full bg-transparent py-3.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none font-sans"
          />
          <kbd className="hidden sm:inline-flex text-[10px] font-mono text-text-muted bg-surface-raised border border-border-hairline px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Liste des résultats / commandes */}
        <Command.List className="max-h-80 overflow-y-auto p-2 space-y-1">
          <Command.Empty className="py-6 text-center text-xs text-text-muted">
            {loadingFiches ? 'Chargement des fiches...' : 'Aucun résultat trouvé.'}
          </Command.Empty>

          {/* Groupe Navigation */}
          <Command.Group
            heading="Navigation rapide"
            className="text-[11px] font-semibold text-text-muted px-2 py-1.5 uppercase tracking-wider"
          >
            <Command.Item
              onSelect={() => runCommand(() => router.push('/create'))}
              className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-text-primary hover:bg-surface-raised data-[selected=true]:bg-surface-raised cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <PlusCircle className="w-4 h-4 text-accent" />
                <span>Créer une fiche</span>
              </div>
              <span className="text-[10px] font-mono text-text-muted">/create</span>
            </Command.Item>

            <Command.Item
              onSelect={() => runCommand(() => router.push('/explorer'))}
              className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-text-primary hover:bg-surface-raised data-[selected=true]:bg-surface-raised cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-text-secondary" />
                <span>Explorer les fiches</span>
              </div>
              <span className="text-[10px] font-mono text-text-muted">/explorer</span>
            </Command.Item>

            <Command.Item
              onSelect={() => runCommand(() => router.push('/dashboard'))}
              className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-text-primary hover:bg-surface-raised data-[selected=true]:bg-surface-raised cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-text-secondary" />
                <span>Tableau de bord</span>
              </div>
              <span className="text-[10px] font-mono text-text-muted">/dashboard</span>
            </Command.Item>
          </Command.Group>

          {/* Groupe Préférences */}
          <Command.Group
            heading="Préférences"
            className="text-[11px] font-semibold text-text-muted px-2 py-1.5 uppercase tracking-wider pt-2 border-t border-border-hairline/60"
          >
            <Command.Item
              onSelect={() => runCommand(toggleTheme)}
              className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-text-primary hover:bg-surface-raised data-[selected=true]:bg-surface-raised cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {resolvedTheme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-400" />
                )}
                <span>Basculer le thème ({resolvedTheme === 'dark' ? 'Mode Clair' : 'Mode Sombre'})</span>
              </div>
              <span className="text-[10px] font-mono text-text-muted">Thème</span>
            </Command.Item>
          </Command.Group>

          {/* Groupe Fiches techniques récupérées de Supabase */}
          {fiches.length > 0 && (
            <Command.Group
              heading="Fiches techniques récentes"
              className="text-[11px] font-semibold text-text-muted px-2 py-1.5 uppercase tracking-wider pt-2 border-t border-border-hairline/60"
            >
              {fiches.map((f) => (
                <Command.Item
                  key={f.id}
                  value={`${f.title} ${f.category || ''} ${(f.tags || []).join(' ')}`}
                  onSelect={() => runCommand(() => router.push(`/fiche/${f.id}`))}
                  className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-text-primary hover:bg-surface-raised data-[selected=true]:bg-surface-raised cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <FileText className="w-4 h-4 text-text-muted shrink-0" />
                    <span className="truncate">{f.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {f.category && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-raised border border-border-hairline text-accent">
                        {f.category}
                      </span>
                    )}
                    <CornerDownLeft className="w-3 h-3 text-text-muted" />
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>

        {/* Footer d'aide de la palette */}
        <div className="px-4 py-2 border-t border-border-hairline bg-surface-base/80 flex items-center justify-between text-[11px] text-text-muted">
          <div className="flex items-center gap-3">
            <span>Navigation <kbd className="font-mono bg-surface-raised px-1 py-0.5 rounded border border-border-hairline">↑</kbd> <kbd className="font-mono bg-surface-raised px-1 py-0.5 rounded border border-border-hairline">↓</kbd></span>
            <span>Sélectionner <kbd className="font-mono bg-surface-raised px-1 py-0.5 rounded border border-border-hairline">↵</kbd></span>
          </div>
          <span className="font-mono">Fiche · Raycast UI</span>
        </div>
      </div>
    </Command.Dialog>
  )
}
