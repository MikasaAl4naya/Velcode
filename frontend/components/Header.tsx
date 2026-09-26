'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const NAV = [
  { label: 'Услуги', href: '/#service' },
  { label: 'Портфолио', href: '/#portfolio' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Контакты', href: '/#contacts' },
]

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 h-[72px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Image
            src="https://img3.creatium.ru/disk2/0e/c5/0d/1eba913d4929aa053fc67deb7fc870ba64/frame_2_cropped.svg"
            alt="Велкод"
            width={140}
            height={36}
            priority
            unoptimized
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-2 text-[15px] text-[#333] hover:text-[#2583FF] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Social + CTA */}
        <div className="hidden md:flex items-center gap-4">
          <a href="https://t.me/VelcodeBot" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8-1.68 7.92c-.12.56-.46.7-.93.44l-2.57-1.9-1.24 1.2c-.14.14-.26.26-.53.26l.19-2.68 4.87-4.4c.21-.19-.05-.3-.33-.11L7.4 14.52l-2.53-.79c-.55-.17-.56-.55.12-.81l9.88-3.81c.46-.17.86.11.77.69z" fill="#2583FF"/>
            </svg>
          </a>
          <Link
            href="/#contacts"
            className="bg-[#2583FF] hover:bg-[#0872FF] text-white text-[14px] font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Оставить заявку
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          onClick={() => setOpen(!open)}
          aria-label="Меню"
        >
          <span className="block w-6 h-0.5 bg-[#333] mb-1.5" />
          <span className="block w-6 h-0.5 bg-[#333] mb-1.5" />
          <span className="block w-6 h-0.5 bg-[#333]" />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-[15px] text-[#333] border-b border-gray-100"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/#contacts"
            onClick={() => setOpen(false)}
            className="mt-2 bg-[#2583FF] hover:bg-[#0872FF] text-white text-[14px] font-semibold px-5 py-3 rounded-lg text-center transition-colors"
          >
            Оставить заявку
          </Link>
        </div>
      )}
    </header>
  )
}
