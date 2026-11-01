'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Check, X, Pencil, Loader2 } from 'lucide-react'
import { Linkedin } from '@/components/icons/Linkedin'

interface ProfileHeaderProps {
  initialDisplayName: string | null
  initialLinkedinUrl?: string | null
  email: string
}

export default function ProfileHeader({
  initialDisplayName,
  initialLinkedinUrl = null,
  email,
}: ProfileHeaderProps) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState<string>(initialDisplayName || '')
  const [linkedinUrl, setLinkedinUrl] = useState<string>(initialLinkedinUrl || '')
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState<string>(initialDisplayName || '')
  const [inputLinkedin, setInputLinkedin] = useState<string>(initialLinkedinUrl || '')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed) {
      setErrorMessage('Le nom ne peut pas être vide')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: trimmed,
          linkedin_url: inputLinkedin.trim(),
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setDisplayName(trimmed)
        setLinkedinUrl(data.linkedin_url || inputLinkedin.trim() || '')
        setIsEditing(false)
        setSuccessMessage('Profil mis à jour avec succès')
        setTimeout(() => setSuccessMessage(null), 3000)
        router.refresh()
      } else {
        setErrorMessage(data.error || 'Erreur lors de la mise à jour')
      }
    } catch {
      setErrorMessage('Erreur réseau lors de la mise à jour')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setInputValue(displayName)
    setInputLinkedin(linkedinUrl)
    setIsEditing(false)
    setErrorMessage(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Tableau de bord
        </h1>

        {!isEditing && (
          <button
            type="button"
            onClick={() => {
              setInputValue(displayName || '')
              setInputLinkedin(linkedinUrl || '')
              setIsEditing(true)
            }}
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground bg-card border border-border px-2.5 py-1 rounded-md transition-colors hover:border-accent shadow-xs cursor-pointer"
          >
            <Pencil className="w-3 h-3 text-accent" />
            <span>Modifier mon profil</span>
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="flex flex-wrap items-center gap-2.5 text-sm text-muted">
          <User className="w-4 h-4 text-accent shrink-0" />
          <span>Auteur :</span>
          <span className="text-foreground font-semibold text-base">
            {displayName || 'Senior Dev'}
          </span>
          {linkedinUrl && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#0A66C2] hover:underline bg-[#0A66C2]/10 border border-[#0A66C2]/20 px-2 py-0.5 rounded-full font-medium"
            >
              <Linkedin className="w-3 h-3 fill-current" />
              <span>LinkedIn</span>
            </a>
          )}
          <span className="text-xs text-muted">({email})</span>
          {successMessage && (
            <span className="text-xs text-accent font-medium inline-flex items-center gap-1 ml-2 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>{successMessage}</span>
            </span>
          )}
        </div>
      ) : (
        <form onSubmit={handleSave} className="bg-card border border-border p-4 rounded-lg shadow-sm space-y-3.5 max-w-lg animate-in fade-in">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground">
              Nom affiché
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ex: Équipe Fiche ou Koffi Senior"
              disabled={isLoading}
              maxLength={50}
              autoFocus
              className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent shadow-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Linkedin className="w-3.5 h-3.5 text-[#0A66C2] fill-current" />
              <span>Profil LinkedIn (Proof-of-Work)</span>
            </label>
            <input
              type="url"
              value={inputLinkedin}
              onChange={(e) => setInputLinkedin(e.target.value)}
              placeholder="https://www.linkedin.com/in/votre-profil"
              disabled={isLoading}
              className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-1 focus:ring-accent shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 bg-accent hover:opacity-90 text-white px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Enregistrer</span>
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="inline-flex items-center gap-1 text-muted hover:text-foreground border border-border px-3 py-1.5 rounded-md text-xs transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Annuler</span>
            </button>

            {errorMessage && (
              <span className="text-xs text-red-500 font-medium ml-2">{errorMessage}</span>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
