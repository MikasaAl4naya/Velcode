import ContactForm from './ContactForm'

export default function Contacts() {
  return (
    <section id="contacts" style={{ background: '#ffffff' }}>
      <div style={{ padding: '0 50px 60px' }}>
        {/* Dark card */}
        <div style={{
          background: '#171819', borderRadius: 32,
          padding: 70,
          display: 'flex', gap: 140, alignItems: 'flex-start',
          maxWidth: 1600, margin: '0 auto',
        }} className="contacts-card">

          {/* Left: contact info */}
          <div style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            alignSelf: 'stretch', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 35 }}>
              <div>
                <h2 style={{
                  margin: 0, fontSize: 64, fontWeight: 400, color: '#ffffff',
                  letterSpacing: '-1.28px',
                }}>
                  Контакты
                </h2>
              </div>
              <p style={{
                margin: 0, fontSize: 16, color: 'rgba(255,255,255,0.7)',
                lineHeight: '22px', fontWeight: 400, letterSpacing: '-0.32px',
              }}>
                Остались вопросы? Свяжитесь с нами<br />
                любым удобным способом
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {/* Social icons */}
              <div style={{ display: 'flex', gap: 5 }}>
                <a
                  href="https://max.ru/id381914585931_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="MAX"
                  style={{
                    width: 40, height: 40, borderRadius: 30,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="10" fill="rgba(255,255,255,0.15)"/>
                    <text x="11" y="15.5" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="white">MAX</text>
                  </svg>
                </a>
                <a
                  href="https://t.me/VelcodeBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Telegram"
                  style={{
                    width: 40, height: 40, borderRadius: 30,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8-1.68 7.92c-.12.56-.46.7-.93.44l-2.57-1.9-1.24 1.2c-.14.14-.26.26-.53.26l.19-2.68 4.87-4.4c.21-.19-.05-.3-.33-.11L7.4 14.52l-2.53-.79c-.55-.17-.56-.55.12-.81l9.88-3.81c.46-.17.86.11.77.69z" fill="currentColor"/>
                  </svg>
                </a>
              </div>

              {/* Contact details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                <a
                  href="tel:+79956850793"
                  style={{
                    fontSize: 20, fontWeight: 400, color: '#ffffff',
                    textDecoration: 'none', letterSpacing: '-0.4px',
                  }}
                >
                  +7 (995) 685-07-93
                </a>
                <a
                  href="mailto:velcode@inbox.ru"
                  style={{
                    fontSize: 20, fontWeight: 400, color: '#ffffff',
                    textDecoration: 'none', letterSpacing: '-0.4px',
                  }}
                >
                  velcode@inbox.ru
                </a>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'flex', gap: 24, alignItems: 'flex-start',
              paddingTop: 10, paddingBottom: 40, paddingLeft: 8, paddingRight: 8,
              overflow: 'hidden',
            }}>
              <div style={{ flex: 1 }}>
                <p style={{
                  margin: '0 0 10px', fontSize: 24, fontWeight: 500, color: '#ffffff',
                  letterSpacing: '-0.48px',
                }}>
                  Оставьте заявку на бесплатную консультацию
                </p>
                <p style={{
                  margin: 0, fontSize: 16, color: 'rgba(255,255,255,0.7)',
                  letterSpacing: '-0.32px', fontWeight: 400,
                }}>
                  Изучим текущую ситуацию, покажем слабые места и подскажем, как их закрыть.
                </p>
              </div>
              <div style={{ flexShrink: 0, width: 30, height: 30 }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                  <path d="M7 17L17 7M17 7H7M17 7V17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <ContactForm />
          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 1000px) {
          .contacts-card { flex-direction: column !important; gap: 50px !important; padding: 40px !important; }
        }
        @media (max-width: 600px) {
          .contacts-card { padding: 28px !important; border-radius: 24px !important; }
          #contacts > div { padding-left: 16px !important; padding-right: 16px !important; }
        }
      `}</style>
    </section>
  )
}
