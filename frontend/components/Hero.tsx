'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'

const MARQUEE_TEXT =
  '· САЙТЫ ПОД КЛЮЧ · UX/UI ЛЮБОЙ СЛОЖНОСТИ · ВНЕДРЕНИЕ ИИ · ИНТЕГРАЦИИ С 1С И БИТРИКС24 · ПРОДВИЖЕНИЕ · ФИРМЕННЫЙ СТИЛЬ · ДОРАБОТКА 1С · СОЗДАНИЕ ЧАТ-БОТОВ  '

export default function Hero() {
  const marqueeRef = useRef<HTMLDivElement>(null)
  const tweenRef = useRef<gsap.core.Tween | null>(null)

  useEffect(() => {
    const el = marqueeRef.current
    if (!el) return

    const play = () => {
      tweenRef.current?.kill()
      const width = el.children[0]
        ? (el.children[0] as HTMLElement).offsetWidth
        : 0
      if (!width) return
      tweenRef.current = gsap.fromTo(
        el.children,
        { x: 0 },
        { x: -width, duration: width / 20, ease: 'none', repeat: -1 },
      )
    }

    play()
    window.addEventListener('resize', play)
    return () => {
      tweenRef.current?.kill()
      window.removeEventListener('resize', play)
    }
  }, [])

  return (
    <section
      id="main"
      className="relative min-h-screen flex flex-col"
      style={{
        backgroundImage: `url('https://img3.creatium.ru/disk2/af/93/59/bc699dfc530687d44c0c35884138c30553/frame_15_1.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-32 w-full">
          <div className="max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold text-white leading-tight mb-6">
              Сайты под ключ<br />
              и&nbsp;автоматизация<br />
              процессов для<br />
              <span className="text-[#4a98ff]">вашего бизнеса</span>
            </h1>
            <p className="text-white/80 text-lg mb-10 leading-relaxed">
              Разработка и автоматизация под ключ с гарантией и техподдержкой:
              связываем сайты, 1С и CRM в единую рабочую систему.
              <br />
              Начните с бесплатного аудита!
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/#contacts"
                className="bg-[#2583FF] hover:bg-[#0872FF] text-white font-semibold px-7 py-3.5 rounded-lg transition-colors text-[15px]"
              >
                Получить бесплатный аудит ↗
              </Link>
              <Link
                href="/#service"
                className="border border-white/40 text-white hover:border-white hover:bg-white/10 font-semibold px-7 py-3.5 rounded-lg transition-colors text-[15px]"
              >
                Смотреть услуги
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Marquee strip */}
      <div className="relative z-10 overflow-hidden bg-[#2583FF]/20 backdrop-blur-sm border-t border-white/10">
        <div ref={marqueeRef} className="flex whitespace-nowrap py-3">
          {[0, 1].map((i) => (
            <span
              key={i}
              className="text-white/90 font-semibold text-[13px] tracking-wider uppercase px-4 shrink-0"
            >
              {MARQUEE_TEXT}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
