'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { FaqItem } from '@/lib/api'

type Props = { items: FaqItem[] }

const FEATURES = [
  'Фиксированные сроки и стоимость в договоре',
  'Техническая поддержка после запуска',
  'Современный стек: React, FastAPI, Next.js',
  'Интеграции с любыми системами',
]

export default function Faq({ items }: Props) {
  const [openId, setOpenId] = useState<number | null>(null)

  const toggle = (id: number) => setOpenId((prev) => (prev === id ? null : id))

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-[1600px] mx-auto px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left: heading + features */}
          <div>
            <h2 className="text-[40px] sm:text-[48px] font-bold text-[#171819] leading-tight mb-6">
              Почему выбирают<br />
              нас
            </h2>
            <p className="text-[#171819]/60 text-[16px] mb-10 leading-relaxed max-w-md">
              Мы берём на себя полный цикл — от идеи до запуска
              и&nbsp;дальнейшего сопровождения вашего проекта.
            </p>

            {/* Feature list with blue bullets */}
            <ul className="flex flex-col gap-5 mb-10">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-4">
                  <span className="mt-1 shrink-0 w-4 h-4 rounded-full bg-[#7D98F0]" />
                  <span className="text-[#171819] text-[16px] leading-snug font-medium">{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/#contacts"
              className="inline-block bg-[#171819] hover:bg-[#2d3032] text-white text-[14px] font-semibold px-7 py-3.5 rounded-full transition-colors"
            >
              Оставить заявку
            </Link>
          </div>

          {/* Right: FAQ accordion */}
          <div>
            <h3 className="text-[24px] font-bold text-[#171819] mb-6">
              Часто задаваемые вопросы
            </h3>

            {items.length === 0 ? (
              <p className="text-[#171819]/40">Вопросы появятся позже.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {items.map((item) => {
                  const isOpen = openId === item.id
                  return (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-2xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggle(item.id)}
                        className="w-full flex items-center justify-between px-6 py-5 text-left gap-4 hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-[#171819] text-[15px] leading-snug">
                          {item.question}
                        </span>
                        <span
                          className={`shrink-0 w-7 h-7 rounded-full bg-[#171819] text-white flex items-center justify-center text-[14px] transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        >
                          ↓
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-5 text-[#171819]/60 text-[15px] leading-relaxed border-t border-gray-100 pt-4">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
