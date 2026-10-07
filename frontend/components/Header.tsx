'use client'

import { useState } from 'react'
import Link from 'next/link'

const NAV = [
  { label: 'Услуги', href: '/#service' },
  { label: 'Преимущества', href: '/#advantages' },
  { label: 'Портфолио', href: '/#portfolio' },
  { label: 'Контакты', href: '/#contacts' },
]

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: '#ffffff',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '25px 50px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', maxWidth: 1600,
        }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0, paddingBottom: 8 }}>
            <span style={{
              fontSize: 36, fontWeight: 300, color: '#171819',
              letterSpacing: '-0.72px', lineHeight: '22px',
            }}>
              велкод
            </span>
          </Link>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 40 }} className="header-right">
            {/* Desktop nav */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: 40 }} className="desktop-nav">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    fontSize: 16, color: 'rgba(23,24,25,0.7)',
                    textDecoration: 'none', fontWeight: 400,
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link
                href="/#contacts"
                style={{
                  background: '#171819', color: '#ffffff', fontSize: 16, fontWeight: 400,
                  padding: '0 22px', height: 46, borderRadius: 30,
                  textDecoration: 'none', display: 'flex', alignItems: 'center',
                  border: '0.5px solid #26292d', whiteSpace: 'nowrap',
                }}
              >
                Оставить заявку
              </Link>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {/* MAX / WhatsApp icon */}
                <a
                  href="https://max.ru/id381914585931_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="MAX"
                  style={{
                    width: 40, height: 40, borderRadius: 30,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#171819', textDecoration: 'none',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="10" fill="#171819"/>
                    <text x="11" y="15.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="white">MAX</text>
                  </svg>
                </a>

                {/* Telegram */}
                <a
                  href="https://t.me/VelcodeBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Telegram"
                  style={{
                    width: 40, height: 40, borderRadius: 30,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#171819', textDecoration: 'none',
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8-1.68 7.92c-.12.56-.46.7-.93.44l-2.57-1.9-1.24 1.2c-.14.14-.26.26-.53.26l.19-2.68 4.87-4.4c.21-.19-.05-.3-.33-.11L7.4 14.52l-2.53-.79c-.55-.17-.56-.55.12-.81l9.88-3.81c.46-.17.86.11.77.69z" fill="currentColor"/>
                  </svg>
                </a>
              </div>

              {/* Mobile burger */}
              <button
                className="mobile-burger"
                onClick={() => setOpen(!open)}
                aria-label="Меню"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'none' }}
              >
                <span style={{ display: 'block', width: 22, height: 2, background: '#171819', marginBottom: 5 }} />
                <span style={{ display: 'block', width: 22, height: 2, background: '#171819', marginBottom: 5 }} />
                <span style={{ display: 'block', width: 22, height: 2, background: '#171819' }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ background: '#ffffff', borderTop: '1px solid #f0f0f0', padding: '12px 24px 20px' }}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{
                display: 'block', padding: '14px 0', fontSize: 16, color: '#171819',
                textDecoration: 'none', borderBottom: '1px solid #f0f0f0',
              }}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/#contacts"
            onClick={() => setOpen(false)}
            style={{
              display: 'block', marginTop: 12, background: '#171819', color: '#ffffff',
              fontSize: 16, padding: '14px 0', borderRadius: 30,
              textDecoration: 'none', textAlign: 'center',
            }}
          >
            Оставить заявку
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-burger { display: flex !important; }
        }
        @media (max-width: 600px) {
          .header-right { gap: 10px !important; }
        }
      `}</style>
    </header>
  )
}
