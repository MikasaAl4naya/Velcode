import Link from 'next/link'

const TAGS_ROW1 = ['Разработка сайтов', 'Веб-дизайн', 'Внедрение ИИ']
const TAGS_ROW2 = ['Продвижение', 'Интеграции с 1С и Битрикс24']

export default function Hero() {
  return (
    <section
      id="main"
      style={{
        background: '#ffffff',
        minHeight: 952,
        paddingTop: 96,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        paddingBottom: 20,
      }}>
        <div style={{
          maxWidth: 1600,
          width: '100%',
          padding: '0 50px',
          display: 'flex',
          alignItems: 'stretch',
          gap: 0,
          boxSizing: 'border-box',
        }} className="hero-inner">

          {/* Left column */}
          <div style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            paddingTop: 55, paddingBottom: 45,
            flexShrink: 0, marginRight: -50,
          }} className="hero-left">

            {/* Top group: heading + description + buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 70 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 50 }}>
                {/* Heading */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h1 style={{ margin: 0, lineHeight: '78px', fontSize: 71, fontWeight: 500, letterSpacing: '-1.4px' }}>
                    <span style={{ color: '#5366a4' }}>Цифровые решения</span>
                  </h1>
                  <h1 style={{ margin: 0, lineHeight: '78px', fontSize: 70, fontWeight: 500, color: '#171819', letterSpacing: '-1.4px' }}>
                    для вашего бизнеса
                  </h1>
                </div>

                {/* Description */}
                <p style={{
                  margin: 0, fontSize: 16, color: 'rgba(23,24,25,0.7)',
                  lineHeight: '22px', fontWeight: 300,
                }}>
                  Веб-разработка и автоматизация процессов. Создадим<br />
                  и поддержим всю digital-инфраструктуру вашей компании.
                </p>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Link
                  href="/#contacts"
                  style={{
                    background: '#171819', color: '#ffffff', fontSize: 16, fontWeight: 400,
                    height: 56, padding: '0 25px', borderRadius: 30,
                    textDecoration: 'none', display: 'flex', alignItems: 'center',
                    border: '0.5px solid #26292d', whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >
                  Получить консультацию
                </Link>

                <Link
                  href="/#service"
                  style={{
                    background: '#ffffff', color: '#171819', fontSize: 16, fontWeight: 300,
                    height: 56, paddingRight: 25,
                    borderRadius: 30, border: '1px solid #d0d1d1',
                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 15,
                    whiteSpace: 'nowrap', flexShrink: 0,
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
                  Наши услуги
                </Link>
              </div>
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 0 }}>
                {TAGS_ROW1.map(tag => (
                  <span key={tag} style={{
                    background: '#ffffff', border: '1px solid #d0d1d1',
                    color: '#171819', fontSize: 15, fontWeight: 300,
                    height: 40, padding: '0 20px', borderRadius: 30,
                    display: 'flex', alignItems: 'center', flexShrink: 0,
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 0 }}>
                {TAGS_ROW2.map(tag => (
                  <span key={tag} style={{
                    background: '#ffffff', border: '1px solid #d0d1d1',
                    color: '#171819', fontSize: 15, fontWeight: 300,
                    height: 40, padding: '0 20px', borderRadius: 30,
                    display: 'flex', alignItems: 'center', flexShrink: 0,
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: price card + torus */}
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>

            {/* Price card (overlaps torus by 200px) */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
              justifyContent: 'flex-end',
              height: '100%', paddingBottom: 40,
              marginRight: -200, zIndex: 2, position: 'relative',
            }}>
              {/* Badge */}
              <div style={{
                background: '#7183bd', color: '#ffffff',
                fontSize: 14, fontWeight: 500,
                padding: 10, borderRadius: 30,
                marginBottom: -8, position: 'relative', zIndex: 2,
              }}>
                + бесплатный аудит
              </div>

              {/* Glassmorphism card */}
              <div style={{
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                background: 'linear-gradient(270deg, rgba(235,242,255,0.5) 0%, rgba(255,255,255,0.5) 100%)',
                border: '1px solid rgba(255,255,255,0.5)',
                borderRadius: 25,
                padding: '10px 24px 10px 10px',
                display: 'flex', gap: 20, alignItems: 'center',
                zIndex: 1, position: 'relative',
              }}>
                {/* Image placeholder */}
                <div style={{
                  width: 110, height: 80, borderRadius: 20,
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #0d0d0d 100%)',
                  flexShrink: 0, overflow: 'hidden', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: '100%', height: '100%',
                    background: 'repeating-conic-gradient(#222 0% 25%, #111 0% 50%) 0 0 / 20px 20px',
                  }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 300, color: '#171819' }}>Сайт под ключ</p>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 500, color: '#171819' }}>от 36 000 ₽</p>
                </div>

                {/* Arrow circle */}
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  border: '1px solid rgba(23,24,25,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path d="M7 17L17 7M17 7H7M17 7V17" stroke="#171819" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Torus */}
            <div style={{ width: 780, height: 780, flexShrink: 0, zIndex: 1, position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/torus.png"
                alt=""
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  display: 'block',
                  maskImage: 'radial-gradient(circle at 50% 50%, black 55%, transparent 78%)',
                  WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 55%, transparent 78%)',
                }}
              />
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .hero-inner { flex-direction: column !important; padding: 20px 24px !important; }
          .hero-left { margin-right: 0 !important; padding-top: 30px !important; padding-bottom: 30px !important; }
          .hero-inner > div:last-child { justify-content: center !important; }
          .hero-inner > div:last-child > div:last-child { width: 100% !important; max-width: 500px !important; height: auto !important; }
          .hero-inner > div:last-child > div:last-child img { width: 100% !important; height: auto !important; }
          .hero-inner > div:last-child > div:first-child { display: none !important; }
        }
        @media (max-width: 600px) {
          .hero-left h1 { font-size: 44px !important; line-height: 52px !important; }
        }
      `}</style>
    </section>
  )
}
