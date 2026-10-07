import Link from 'next/link'
import type { FaqItem } from '@/lib/api'

type Props = { items: FaqItem[] }

const FALLBACK: FaqItem[] = [
  { id: 1, sort_order: 1, question: 'Бесплатная консультация', answer: 'Мы начинаем работу с бесплатной консультации, на которой выявляем ваши потребности и определяем приблизительную стоимость работ.' },
  { id: 2, sort_order: 2, question: 'Разделение проекта на этапы', answer: 'Делим проект на логические этапы (анализ, дизайн, разработка). Вы контролируете каждый этап и можете влиять на него в реальном времени.' },
  { id: 3, sort_order: 3, question: 'Многопрофильность решений', answer: 'В нашей команде работают опытные специалисты, которые разработают IT-решения под ключ для проектов любой сложности и сферы бизнеса.' },
  { id: 4, sort_order: 4, question: 'Разработка под ключ', answer: 'Вам достаточно описать концепцию или задачу. Мы превратим её в готовый цифровой продукт, который привлекает клиентов и приносит деньги.' },
]

export default function Advantages({ items }: Props) {
  const list = (items.length > 0 ? items : FALLBACK).slice(0, 4)

  return (
    <section id="advantages" style={{ background: '#ffffff', padding: '60px 0' }}>
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '0 50px' }}>
        <div style={{
          display: 'flex', gap: 100, alignItems: 'flex-start',
        }} className="advantages-grid">

          {/* Left: heading + CTA */}
          <div style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            paddingBottom: 20, alignSelf: 'stretch', flexShrink: 0, width: 462,
          }}>
            <div>
              <h2 style={{
                margin: 0, fontWeight: 500, letterSpacing: '-1.4px',
              }}>
                <span style={{ display: 'block', fontSize: 70, lineHeight: '84px', color: '#2d2d2d' }}>Почему стоит </span>
                <span style={{ display: 'block', fontSize: 70, lineHeight: '84px', color: '#5366a4' }}>выбрать нас</span>
              </h2>
            </div>
            <Link
              href="/#contacts"
              style={{
                background: '#171819', color: '#ffffff', fontSize: 16, fontWeight: 400,
                height: 56, padding: '0 25px', borderRadius: 30,
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
                border: '0.5px solid #26292d', whiteSpace: 'nowrap', alignSelf: 'flex-start',
              }}
            >
              Получить консультацию
            </Link>
          </div>

          {/* Right: list */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            paddingTop: 20,
          }}>
            {list.map((item, i) => (
              <div
                key={item.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                  gap: 20, paddingRight: 20,
                  paddingTop: i === 0 ? 0 : 40,
                  paddingBottom: i < list.length - 1 ? 40 : 0,
                  borderBottom: i < list.length - 1 ? '1px solid #d0d1d1' : 'none',
                }}
              >
                {/* Left: dot + title */}
                <div style={{
                  display: 'flex', gap: 15, alignItems: 'center',
                  flexShrink: 0, width: 420,
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#7183bd', flexShrink: 0,
                  }} />
                  <p style={{
                    margin: 0, fontSize: 24, fontWeight: 400, color: '#18191a',
                    letterSpacing: '-0.48px',
                  }}>
                    {item.question}
                  </p>
                </div>

                {/* Right: description */}
                <p style={{
                  margin: 0, flex: 1, fontSize: 16, fontWeight: 300,
                  color: 'rgba(30,32,34,0.7)', lineHeight: '22px',
                  letterSpacing: '-0.32px',
                }}>
                  {item.answer}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 1000px) {
          .advantages-grid { flex-direction: column !important; gap: 40px !important; }
          .advantages-grid > div:first-child { width: 100% !important; }
        }
        @media (max-width: 600px) {
          .advantages-grid > div:last-child > div { flex-direction: column !important; }
        }
      `}</style>
    </section>
  )
}
