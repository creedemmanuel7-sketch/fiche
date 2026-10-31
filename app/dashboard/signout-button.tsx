'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="border border-border bg-card text-foreground hover:border-gray-400 dark:hover:border-gray-600 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
    >
      Se déconnecter
    </button>
  )
}
