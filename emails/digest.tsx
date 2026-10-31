import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export interface TopFiche {
  id: string
  title: string
  views: number
  useful: number
}

export interface DigestEmailProps {
  authorName?: string
  viewsThisMonth: number
  usefulThisMonth: number
  topFiches: TopFiche[]
  dashboardUrl?: string
}

export default function DigestEmail({
  authorName = 'Auteur',
  viewsThisMonth = 0,
  usefulThisMonth = 0,
  topFiches = [],
  dashboardUrl = 'https://fiche-pi.vercel.app/dashboard',
}: DigestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Votre impact sur Fiche ce mois-ci</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* En-tête */}
          <Section style={headerSection}>
            <Text style={logoText}>Fiche</Text>
          </Section>

          {/* Titre */}
          <Heading style={headingStyle}>
            Votre impact sur Fiche ce mois-ci
          </Heading>

          <Text style={greetingText}>
            Bonjour {authorName}, voici le récapitulatif de l'impact de vos partages techniques au cours des 30 derniers jours.
          </Text>

          {/* Compteurs */}
          <Section style={statsSection}>
            <div style={statBox}>
              <Text style={statNumber}>{viewsThisMonth}</Text>
              <Text style={statLabel}>Vues générées</Text>
            </div>
            <div style={statBox}>
              <Text style={statNumber}>{usefulThisMonth}</Text>
              <Text style={statLabel}>Votes « Utile »</Text>
            </div>
          </Section>

          <Hr style={hrStyle} />

          {/* Top fiches */}
          <Section style={listSection}>
            <Text style={sectionTitle}>Vos fiches les plus consultées ce mois-ci</Text>
            {topFiches.length === 0 ? (
              <Text style={emptyText}>Aucune consultation enregistrée ce mois-ci.</Text>
            ) : (
              topFiches.slice(0, 3).map((fiche) => (
                <div key={fiche.id} style={ficheItemStyle}>
                  <Text style={ficheTitle}>{fiche.title}</Text>
                  <Text style={ficheStats}>
                    {fiche.views} vue{fiche.views > 1 ? 's' : ''} • {fiche.useful} vote{fiche.useful > 1 ? 's' : ''} « Utile »
                  </Text>
                </div>
              ))
            )}
          </Section>

          <Hr style={hrStyle} />

          {/* Bouton CTA */}
          <Section style={ctaSection}>
            <Button style={buttonStyle} href={dashboardUrl}>
              Voir mon dashboard
            </Button>
          </Section>

          <Text style={footerText}>
            Fiche — Le savoir technique de la communauté, capitalisé.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const mainStyle: React.CSSProperties = {
  backgroundColor: '#FAFAFA',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  padding: '40px 0',
}

const containerStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E5E5',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '560px',
  padding: '40px',
}

const headerSection: React.CSSProperties = {
  marginBottom: '24px',
}

const logoText: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#1A1A1A',
  margin: 0,
}

const headingStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: '700',
  color: '#1A1A1A',
  lineHeight: '1.3',
  margin: '0 0 16px 0',
}

const greetingText: React.CSSProperties = {
  fontSize: '14px',
  color: '#555555',
  lineHeight: '1.5',
  margin: '0 0 24px 0',
}

const statsSection: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  marginBottom: '24px',
}

const statBox: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#FAFAFA',
  border: '1px solid #E5E5E5',
  borderRadius: '6px',
  padding: '16px',
  textAlign: 'center' as const,
}

const statNumber: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#1A1A1A',
  margin: '0 0 4px 0',
}

const statLabel: React.CSSProperties = {
  fontSize: '12px',
  color: '#666666',
  margin: 0,
}

const hrStyle: React.CSSProperties = {
  borderColor: '#E5E5E5',
  borderStyle: 'solid',
  borderWidth: '1px 0 0 0',
  margin: '24px 0',
}

const listSection: React.CSSProperties = {
  marginBottom: '24px',
}

const sectionTitle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  color: '#888888',
  margin: '0 0 12px 0',
}

const emptyText: React.CSSProperties = {
  fontSize: '13px',
  color: '#999999',
  margin: 0,
}

const ficheItemStyle: React.CSSProperties = {
  borderBottom: '1px solid #F5F5F5',
  padding: '10px 0',
}

const ficheTitle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1A1A1A',
  margin: '0 0 4px 0',
}

const ficheStats: React.CSSProperties = {
  fontSize: '12px',
  color: '#777777',
  fontFamily: 'monospace',
  margin: 0,
}

const ctaSection: React.CSSProperties = {
  textAlign: 'center' as const,
  marginTop: '24px',
  marginBottom: '24px',
}

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#000000',
  borderRadius: '6px',
  color: '#FFFFFF',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const footerText: React.CSSProperties = {
  fontSize: '12px',
  color: '#999999',
  textAlign: 'center' as const,
  marginTop: '24px',
}
