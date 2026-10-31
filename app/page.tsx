import Link from "next/link";

export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Fiche</h1>
      <Link href="/login" className="text-blue-600 underline">
        Connexion
      </Link>
    </div>
  );
}
