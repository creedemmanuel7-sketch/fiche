import { Suspense } from 'react'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/server'
import CreateFicheForm from './create-fiche-form'

async function CreateContent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header user={user ? { email: user.email } : null} />
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 sm:p-10">
        <CreateFicheForm userId={user?.id || null} />
      </main>
    </div>
  )
}

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted">
          Chargement...
        </div>
      }
    >
      <CreateContent />
    </Suspense>
  )
}
