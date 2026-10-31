'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] flex flex-col justify-center py-12 px-6">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div>
          <Link href="/" className="text-xl font-bold tracking-tight text-[#1A1A1A]">
            Fiche
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A] mt-4">
            Connexion
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Accédez à votre espace ou créez un compte
          </p>
        </div>

        <form className="bg-white p-6 border border-[#E5E5E5] rounded space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#E5E5E5] p-2.5 rounded text-sm text-[#1A1A1A] focus:outline-none focus:border-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#E5E5E5] p-2.5 rounded text-sm text-[#1A1A1A] focus:outline-none focus:border-black"
              required
            />
          </div>

          {message && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
              {message}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              onClick={handleSignIn}
              disabled={loading}
              className="bg-black text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="border border-[#E5E5E5] bg-white text-[#1A1A1A] px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              S'inscrire
            </button>
          </div>

          <div className="pt-2 border-t border-[#F5F5F5]">
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={loading}
              className="text-xs text-gray-500 hover:text-black underline transition-colors"
            >
              Se connecter avec un lien magique
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
