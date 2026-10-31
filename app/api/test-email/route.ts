import { NextResponse } from 'next/server'
import { render } from '@react-email/components'
import { resend } from '@/lib/resend'
import DigestEmail, { type TopFiche } from '@/emails/digest'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const to = searchParams.get('to') || 'delivered@resend.dev'

  const mockTopFiches: TopFiche[] = [
    {
      id: '943ad5d5-221e-49ec-b823-87d0cc979918',
      title: 'Centrer une div en Tailwind CSS',
      views: 5,
      useful: 2,
    },
  ]

  const emailComponent = DigestEmail({
    authorName: 'Senior Développeur',
    viewsThisMonth: 5,
    usefulThisMonth: 2,
    topFiches: mockTopFiches,
    dashboardUrl: 'https://fiche-pi.vercel.app/dashboard',
  })

  // Envoi effectif si RESEND_API_KEY est configurée
  let sendStatus = 'skipped'
  let sendError: string | null = null

  if (process.env.RESEND_API_KEY) {
    try {
      const result = await resend.client.emails.send({
        from: 'Fiche <onboarding@resend.dev>',
        to,
        subject: 'Votre impact sur Fiche ce mois-ci (Test)',
        react: emailComponent,
      })
      sendStatus = 'sent: ' + JSON.stringify(result)
    } catch (err: unknown) {
      sendError = err instanceof Error ? err.message : String(err)
      console.error('Erreur envoi email test:', err)
    }
  }

  // Si l'utilisateur demande du JSON (ex: script de test d'API)
  if (searchParams.get('format') === 'json') {
    return NextResponse.json({
      success: true,
      sendStatus,
      sendError,
      to,
    })
  }

  // Rendu HTML direct pour capture visuelle dans le navigateur
  const html = await render(emailComponent)
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
