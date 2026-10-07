'use client'

import { useRef } from 'react'
import Link from 'next/link'
import type { Category, Service } from '@/lib/api'

type Props = { categories: Category[]; services: Service[] }

const CARD_STYLES = [
  { bg: 'linear-gradient(180deg, #BBC8E9 0%, #6E91D0 100%)', btnBg: '#ffffff', btnColor: '#26292d', numOpacity: 'rgba(255,255,255,0.1)', num: '01' },
  { bg: 'linear-gradient(180deg, #171819 0%, #222527 100%)', btnBg: '#7d98f0', btnColor: '#ffffff', numOpacity: 'rgba(116,124,135,0.1)', num: '02' },
  { bg: 'linear-gradient(180deg, #171819 0%, #222527 100%)', btnBg: '#7d98f0', btnColor: '#ffffff', numOpacity: 'rgba(116,124,135,0.1)', num: '03' },
  { bg: 'linear-gradient(180deg, #BBC7E8 0%, #6F91D1 100%)', btnBg: '#ffffff', btnColor: '#26292d', numOpacity: 'rgba(255,255,255,0.1)', num: '04' },
]

const FALLBACK_CATS: Category[] = [
  { id: 1, name: 'Разработка сайта\nпод ключ', icon: null, sort_order: 1 },
  { id: 2, name: 'Реклама\nи продвижение', icon: null, sort_order: 2 },
  { id: 3, name: 'Интеграции\nс 1С и Битрикс24', icon: null, sort_order: 3 },
  { id: 4, name: 'Создание и внедрение\nИИ-ассистентов\nи агентов', icon: null, sort_order: 4 },
]

export default function Services({ categories, services }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const cards = (categories.length > 0 ? categories : FALLBACK_CATS).slice(0, 4)

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 360, behavior: 'smooth' })
  }

  const cheapestPrice = (catId: number): number => {
    const catSvcs = services.filter(s => s.categories.some(c => c.id === catId))
    if (!catSvcs.length) return 36000
    return catSvcs.reduce((min, s) => {
      const p = s.price_discount ?? s.price_full
      return p < min ? p : min
    }, Infinity)
  }

  return (
    <section id="service" style={{ padding: '60px 0', background: '#ffffff', overflow: 'hidden' }}>

      {/* Section header */}
      <div style={{
        maxWidth: 1600, margin: '0 auto 60px', padding: '0 50px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        gap: 32, flexWrap: 'wrap',
      }}>
        <h2 style={{
          margin: 0, fontSize: 70, fontWeight: 500, color: '#2d2d2d',
          letterSpacing: '-1.4px', lineHeight: 1, flexShrink: 0,
        }}>
          Наши услуги
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          <p style={{
            margin: 0, fontSize: 16, color: 'rgba(23,24,25,0.7)',
            lineHeight: '22px', fontWeight: 300,
          }}>
            Мы предлагаем широкий спектр digital-услуг: от создания<br />
            чат-ботов до сложных сайтов с интеграциями 1С и Битрикс.
          </p>
          <div style={{ display: 'flex', flexShrink: 0 }}>
            <button
              onClick={() => scroll(-1)}
              aria-label="Назад"
              style={{
                width: 56, height: 56, borderRadius: '50%',
                border: '1px solid #d0d1d1', background: '#ffffff',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12 4L6 10L12 16" stroke="#171819" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={() => scroll(1)}
              aria-label="Вперёд"
              style={{
                width: 56, height: 56, borderRadius: '50%',
                border: '1px solid #d0d1d1', background: '#ffffff',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M8 4L14 10L8 16" stroke="#171819" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex', gap: 10,
          paddingLeft: 160, paddingRight: 80,
          overflowX: 'auto', scrollbarWidth: 'none',
        }}
        className="services-scroll"
      >
        {cards.map((cat, i) => {
          const price = cheapestPrice(cat.id)
          const c = CARD_STYLES[i]

          return (
            <div
              key={cat.id}
              style={{
                background: c.bg, borderRadius: 30,
                padding: 30, flexShrink: 0, width: 350, height: 500,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                overflow: 'hidden', position: 'relative',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                <span style={{
                  fontSize: 96, fontWeight: 700, lineHeight: 1,
                  color: c.numOpacity, letterSpacing: '-1.92px',
                }}>
                  {c.num}
                </span>
                <h3 style={{
                  margin: 0, fontSize: 22, fontWeight: 500, color: '#ffffff',
                  letterSpacing: '-0.44px', lineHeight: 1.3, whiteSpace: 'pre-line',
                }}>
                  {cat.name}
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 26, fontWeight: 500, color: '#ffffff', letterSpacing: '-0.52px', lineHeight: '68px' }}>
                    от {price === 36000 ? '36 000' : price.toLocaleString('ru-RU')} ₽
                  </p>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 400, color: '#ffffff' }}>за проект</p>
                </div>
                <Link
                  href="/#contacts"
                  style={{
                    background: c.btnBg, color: c.btnColor,
                    fontSize: 14, fontWeight: 300, padding: '12px 20px',
                    borderRadius: 24, textDecoration: 'none',
                    letterSpacing: '-0.28px', whiteSpace: 'nowrap',
                    height: 46, display: 'flex', alignItems: 'center',
                  }}
                >
                  Подробнее
                </Link>
              </div>
            </div>
          )
        })}

        {/* CTA card */}
        <div style={{
          border: '1px solid #d0d1d1', borderRadius: 30,
          padding: 30, flexShrink: 0, width: 350, height: 500,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <span style={{
              fontSize: 96, fontWeight: 700, lineHeight: 1,
              color: 'rgba(116,124,135,0.1)', letterSpacing: '-1.92px',
            }}>
              00
            </span>
            <h3 style={{
              margin: 0, fontSize: 22, fontWeight: 500, color: '#171819',
              letterSpacing: '-0.44px', lineHeight: 1.3,
            }}>
              Не можете определиться<br />с выбором услуги?
            </h3>
            <p style={{
              margin: 0, fontSize: 16, color: 'rgba(23,24,25,0.7)',
              lineHeight: '22px', fontWeight: 300,
            }}>
              Оставьте заявку на бесплатную консультацию. Наши специалисты помогут вам подобрать услугу по вашим потребностям и рассчитают примерную стоимость работ.
            </p>
          </div>
          <Link
            href="/#contacts"
            style={{
              background: '#171819', color: '#ffffff',
              fontSize: 14, fontWeight: 400, padding: '0 20px',
              borderRadius: 24, textDecoration: 'none',
              letterSpacing: '-0.28px', height: 46,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            Получить консультацию
          </Link>
        </div>
      </div>

      <style>{`
        .services-scroll::-webkit-scrollbar { display: none; }
        @media (max-width: 768px) {
          .services-scroll { padding-left: 20px !important; padding-right: 20px !important; }
        }
      `}</style>
    </section>
  )
}
