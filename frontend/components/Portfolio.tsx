import Link from 'next/link'
import type { PortfolioItem } from '@/lib/api'

type Props = { items: PortfolioItem[] }

export default function Portfolio({ items }: Props) {
  const featured = items[0] ?? null

  return (
    <section id="portfolio" style={{ background: '#ffffff', padding: '0 0 60px' }}>
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '0 50px' }}>
        <div style={{
          display: 'flex', gap: 120, alignItems: 'center',
        }} className="portfolio-grid">

          {/* Left: blue card with screenshot */}
          <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            {/* Folder tab decoration */}
            <div style={{
              height: 90, marginBottom: -90, position: 'relative', zIndex: 1,
              display: 'flex', alignItems: 'flex-end', gap: 4, paddingLeft: 8,
            }}>
              <div style={{
                width: 100, height: 40,
                background: '#7d9fd8', borderRadius: '12px 12px 0 0',
              }} />
              <div style={{
                width: 60, height: 30,
                background: '#7d9fd8cc', borderRadius: '10px 10px 0 0',
              }} />
            </div>

            {/* Blue card */}
            <div style={{
              background: '#91a9db', borderRadius: 30, overflow: 'hidden',
              position: 'relative', zIndex: 2,
              display: 'flex', flexDirection: 'column',
              alignItems: 'flex-end', justifyContent: 'center',
              paddingBottom: 15, paddingTop: 30, paddingLeft: 40, paddingRight: 40,
            }}>
              {/* Browser mockup */}
              <div style={{
                width: '100%',
                aspectRatio: '963/635',
                borderRadius: 12, overflow: 'hidden',
                background: '#1a1a1a',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              }}>
                {/* Browser chrome */}
                <div style={{
                  background: '#1a1a1a', padding: '8px 14px',
                  display: 'flex', alignItems: 'center', gap: 6,
                  borderBottom: '1px solid #333',
                }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', flexShrink: 0 }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e', flexShrink: 0 }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840', flexShrink: 0 }} />
                  <div style={{
                    flex: 1, background: '#2a2a2a', borderRadius: 4,
                    padding: '3px 10px', fontSize: 11, color: 'rgba(255,255,255,0.35)',
                    marginLeft: 8, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                  }}>
                    {featured?.site_url ?? 'https://velcode.ru'}
                  </div>
                </div>
                {/* Screenshot */}
                {featured?.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featured.image_url}
                    alt={featured.title}
                    style={{ width: '100%', height: 'calc(100% - 32px)', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{
                    height: 'calc(100% - 32px)', background: '#171819',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 12,
                  }}>
                    <div style={{
                      fontSize: 80, fontWeight: 900, color: 'rgba(255,255,255,0.06)',
                      letterSpacing: '-2px',
                    }}>
                      {featured?.title?.charAt(0) ?? 'V'}
                    </div>
                    {featured?.title && (
                      <span style={{ fontSize: 20, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>
                        {featured.title}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: text + CTA */}
          <div style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            alignSelf: 'stretch', paddingTop: 60, paddingBottom: 60,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 50 }}>
              <h2 style={{
                margin: 0, fontSize: 70, fontWeight: 500, color: '#2d2d2d',
                letterSpacing: '-1.4px', lineHeight: 1,
              }}>
                Наши кейсы
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 70 }}>
                <p style={{
                  margin: 0, fontSize: 15, color: 'rgba(23,24,25,0.7)',
                  lineHeight: '22px', fontWeight: 300,
                }}>
                  Мы предлагаем широкий спектр digital-услуг: от создания<br />
                  чат-ботов до сложных сайтов с интеграциями 1С и Битрикс.
                </p>
                <Link
                  href={featured?.site_url ?? '/#contacts'}
                  target={featured?.site_url ? '_blank' : undefined}
                  rel={featured?.site_url ? 'noopener noreferrer' : undefined}
                  style={{
                    background: '#ffffff', color: '#171819',
                    fontSize: 16, fontWeight: 300,
                    height: 56, paddingRight: 25,
                    borderRadius: 30, border: '1px solid #d0d1d1',
                    textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
                    gap: 15, alignSelf: 'flex-start',
                  }}
                >
                  <span style={{
                    width: 56, height: 56, borderRadius: 30, background: '#7183bd',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                      <path d="M7 17L17 7M17 7H7M17 7V17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  Смотреть все работы
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 1000px) {
          .portfolio-grid { flex-direction: column !important; gap: 40px !important; }
        }
      `}</style>
    </section>
  )
}
