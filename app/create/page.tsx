import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CreateFicheForm from './create-fiche-form'

async function CreateContent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <CreateFicheForm userId={user.id} />
}

export default function CreatePage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] p-6 sm:p-12">
      <div className="max-w-2xl mx-auto">
        <Suspense fallback={<p className="text-sm text-gray-500">Chargement...</p>}>
          <CreateContent />
        </Suspense>
      </div>
    </div>
  )
}
