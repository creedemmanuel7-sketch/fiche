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
      className="border border-[#E5E5E5] bg-white text-[#1A1A1A] hover:bg-gray-50 px-4 py-2 rounded text-sm font-medium transition-colors"
    >
      Se déconnecter
    </button>
  )
}
