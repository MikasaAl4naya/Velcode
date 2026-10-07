export default function Footer() {
  return (
    <footer style={{ background: '#ffffff' }}>
      <div style={{ padding: '0 50px 0', maxWidth: 1700, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '60px 0',
          borderTop: '1px solid #d0d1d1',
          maxWidth: 1600, margin: '0 auto',
          flexWrap: 'wrap', gap: 24,
        }}>
          {/* Left: logo + legal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 35, justifyContent: 'flex-end' }}>
            <div style={{ paddingBottom: 8 }}>
              <span style={{
                fontSize: 36, fontWeight: 300, color: '#171819',
                letterSpacing: '-0.72px', lineHeight: '22px',
              }}>
                велкод
              </span>
            </div>
            <p style={{
              margin: 0, fontSize: 16, fontWeight: 300,
              color: 'rgba(23,24,25,0.7)', lineHeight: '30px',
              letterSpacing: '-0.32px',
            }}>
              ИП Манилат Виктория Пхетудоновна<br />
              ИНН: 381914585931<br />
              ОГРНИП: 326385000117097
            </p>
          </div>

          {/* Right: copyright + links */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
            justifyContent: 'center', gap: 40, paddingTop: 5,
          }}>
            <p style={{
              margin: 0, fontSize: 22, fontWeight: 400, color: '#171819',
              letterSpacing: '-0.44px',
            }}>
              2026© velcode.ru, г. Иркутск
            </p>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 20,
            }}>
              <a href="/privacy" style={{
                fontSize: 16, fontWeight: 300, color: 'rgba(23,24,25,0.7)',
                textDecoration: 'underline', letterSpacing: '-0.32px',
              }}>
                Согласие на обработку персональных данных
              </a>
              <a href="/cookies" style={{
                fontSize: 16, fontWeight: 300, color: 'rgba(23,24,25,0.7)',
                textDecoration: 'underline', letterSpacing: '-0.32px',
              }}>
                Согласие на использование файлов cookie
              </a>
              <a href="/policy" style={{
                fontSize: 16, fontWeight: 300, color: 'rgba(23,24,25,0.7)',
                textDecoration: 'underline', letterSpacing: '-0.32px',
              }}>
                Политика в отношении обработки персональных данных
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
