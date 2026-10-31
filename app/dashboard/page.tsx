import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './signout-button'

interface FicheItem {
  id: string
  title: string
  tags: string[]
  stack: string[]
  view_count: number
  created_at: string
}

async function DashboardContent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: fiches, error } = await supabase
    .from('fiches')
    .select('id, title, tags, stack, view_count, created_at')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur chargement fiches:', error)
  }

  const userFiches = (fiches as FicheItem[]) || []

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E5E5]">
        <div>
          <div className="mb-2">
            <Link
              href="/"
              className="text-xs text-gray-500 hover:text-black transition-colors"
            >
              ← Retour à l'accueil
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Connecté en tant que <span className="text-[#1A1A1A] font-medium">{user.email}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/create"
            className="bg-black text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Créer une nouvelle fiche
          </Link>
          <SignOutButton />
        </div>
      </div>

      {/* Liste des fiches */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#1A1A1A]">Mes fiches</h2>

        {userFiches.length === 0 ? (
          <div className="bg-white border border-[#E5E5E5] rounded p-8 text-center">
            <p className="text-gray-500 text-sm">Tu n'as pas encore créé de fiche.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {userFiches.map((fiche) => {
              const dateFormatted = new Date(fiche.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })

              return (
                <div
                  key={fiche.id}
                  className="bg-white border border-[#E5E5E5] rounded p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <Link
                      href={`/fiche/${fiche.id}`}
                      className="font-medium text-[#1A1A1A] text-base leading-snug hover:underline"
                    >
                      {fiche.title}
                    </Link>
                    <div className="text-xs text-gray-400 whitespace-nowrap">
                      {dateFormatted}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F5F5F5] text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {fiche.tags && fiche.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {fiche.stack && fiche.stack.map((item, idx) => (
                        <span
                          key={`stack-${idx}`}
                          className="border border-[#E5E5E5] text-gray-500 px-2 py-0.5 rounded text-xs"
                        >
                          {item}
                        </span>
                      ))}
                    </div>

                    <span className="text-gray-400 font-mono text-[11px]">
                      {fiche.view_count || 0} vue{fiche.view_count > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] p-6 sm:p-12">
      <div className="max-w-3xl mx-auto">
        <Suspense fallback={<p className="text-sm text-gray-500">Chargement...</p>}>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  )
}
