import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const title = searchParams.get('title') || 'Fiche Technique'
    const author = searchParams.get('author') || 'Senior'
    const tagsParam = searchParams.get('tags') || ''
    const tags = tagsParam
      ? tagsParam.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 4)
      : []

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#0A0A0A',
            padding: '60px 80px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Header avec logo Fiche + point vert */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#108966',
                }}
              />
              <span
                style={{
                  color: '#EDEDED',
                  fontSize: '32px',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                }}
              >
                Fiche
              </span>
            </div>

            <span
              style={{
                color: '#737373',
                fontSize: '20px',
                fontWeight: 500,
              }}
            >
              Base de connaissances
            </span>
          </div>

          {/* Titre au centre */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              margin: '30px 0',
            }}
          >
            <h1
              style={{
                color: '#FAFAFA',
                fontSize: title.length > 70 ? '44px' : '56px',
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: '-0.03em',
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </h1>
          </div>

          {/* Footer : Tags à gauche, Auteur à droite */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '30px',
              borderTop: '1px solid #262626',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              {tags.map((tag, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#0A261D',
                    color: '#108966',
                    fontSize: '18px',
                    fontWeight: 600,
                    padding: '8px 18px',
                    borderRadius: '9999px',
                    border: '1px solid #10896640',
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#A3A3A3',
                fontSize: '22px',
              }}
            >
              <span>Par</span>
              <span style={{ color: '#EDEDED', fontWeight: 600 }}>{author}</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : 'Unknown error'
    return new Response(`Failed to generate OG image: ${errorMsg}`, { status: 500 })
  }
}
