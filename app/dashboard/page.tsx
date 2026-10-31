import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './signout-button'

async function UserProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <>
      <p className="mb-4">Connecté en tant que {user.email}</p>
      <SignOutButton />
    </>
  )
}

export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <Suspense fallback={<p>Chargement...</p>}>
        <UserProfile />
      </Suspense>
    </div>
  )
}
