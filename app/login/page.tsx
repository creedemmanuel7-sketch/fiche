'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
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
      router.push('/dashboard')
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
      router.push('/dashboard')
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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setMessage(`Erreur : ${error.message}`)
    } else {
      setMessage('Lien magique envoyé par email.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center py-12 px-6">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div>
          <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
            <Logo />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-4">
            Connexion
          </h1>
          <p className="text-sm text-muted mt-1">
            Accédez à votre espace ou créez un compte
          </p>
        </div>

        <form className="bg-card p-6 sm:p-8 border border-border rounded-md shadow-sm space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
              required
            />
          </div>

          {message && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md shadow-sm">
              {message}
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              onClick={handleSignIn}
              disabled={loading}
              className="bg-foreground text-background px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="border border-border bg-card text-foreground px-4 py-2 rounded-md text-sm font-medium hover:border-gray-400 dark:hover:border-gray-600 disabled:opacity-50 transition-colors shadow-sm"
            >
              S'inscrire
            </button>
          </div>

          <div className="pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={loading}
              className="text-xs text-muted hover:text-foreground underline transition-colors"
            >
              Se connecter avec un lien magique
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
