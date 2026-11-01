'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { createClient } from '@/lib/supabase/client'
import { useIsWhatsAppWebView } from '@/hooks/useIsWhatsAppWebView'
import { ExternalLink, Info } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTarget = searchParams.get('redirect') || '/dashboard'
  const initialInfoMessage = searchParams.get('message') || ''

  const isWhatsApp = useIsWhatsAppWebView()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [infoMessage] = useState(initialInfoMessage)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(`Erreur : ${error.message}`)
      setLoading(false)
    } else {
      router.push(redirectTarget)
      router.refresh()
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setMessage(`Erreur : ${error.message}`)
      setLoading(false)
    } else {
      router.push(redirectTarget)
      router.refresh()
    }
  }

  const handleMagicLink = async () => {
    if (!email) {
      setMessage('Veuillez renseigner votre email.')
      return
    }
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTarget)}`,
      },
    })
    if (error) {
      setMessage(`Erreur : ${error.message}`)
    } else {
      setMessage('Lien magique envoyé par email.')
    }
    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTarget)}`,
      },
    })
    if (error) {
      setMessage(`Erreur : ${error.message}`)
      setLoading(false)
    }
  }

  const handleOpenExternalBrowser = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank')
    }
  }

  return (
    <div className="max-w-md w-full mx-auto space-y-6">
      <div>
        <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
          <Logo />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary mt-4">
          Connexion
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Accédez à votre espace ou créez un compte
        </p>
      </div>

      {infoMessage && (
        <div className="p-3.5 bg-accent-light border border-accent/30 text-accent text-sm rounded-md">
          {infoMessage}
        </div>
      )}

      {/* Bandeau d'information pour la WebView WhatsApp */}
      {isWhatsApp && (
        <div
          id="whatsapp-banner"
          className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs space-y-2.5"
        >
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Vous êtes dans WhatsApp. Pour une expérience optimale, ouvrez ce lien dans votre navigateur externe.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenExternalBrowser}
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-medium text-xs transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ouvrir dans le navigateur</span>
          </button>
        </div>
      )}

      <div className="bg-surface-base p-6 sm:p-8 border border-border-hairline rounded-lg space-y-4">
        {/* Bouton Continuer avec Google - Masqué totalement dans la WebView WhatsApp */}
        {!isWhatsApp && (
          <div id="google-auth-container" className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-md bg-surface-raised hover:bg-surface-overlay border border-border-hairline text-text-primary text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuer avec Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-hairline" />
              </div>
              <div className="relative bg-surface-base px-2 text-xs text-text-muted uppercase tracking-wider">
                ou
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nom@exemple.com"
              className="w-full bg-surface-raised border border-border-hairline rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-raised border border-border-hairline rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              required
            />
          </div>

          {message && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-md">
              {message}
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-text-primary text-surface-canvas px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1 border border-border-hairline bg-surface-raised text-text-primary px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-overlay disabled:opacity-50 transition-colors cursor-pointer"
            >
              S'inscrire
            </button>
          </div>

          <div className="pt-3 border-t border-border-hairline text-center">
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={loading}
              className="text-xs text-text-muted hover:text-text-primary underline transition-colors cursor-pointer"
            >
              Se connecter avec un lien magique
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface-canvas text-text-primary flex flex-col justify-center py-12 px-6">
      <Suspense fallback={<div className="text-center text-sm text-text-muted">Chargement...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
