import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] flex flex-col justify-center px-6">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">Fiche</h1>
          <p className="text-sm text-gray-500 mt-2">
            Transformez vos échanges techniques bruts en fiches structurées, cherchables et capitalisables.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="inline-block bg-black text-white px-5 py-2.5 rounded text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Accéder à l'application
          </Link>
        </div>
      </div>
    </div>
  )
}
