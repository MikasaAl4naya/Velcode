'use client'

import { useState } from 'react'
import type { FaqItem } from '@/lib/api'

type Props = { items: FaqItem[] }

export default function Faq({ items }: Props) {
  const [openId, setOpenId] = useState<number | null>(null)

  const toggle = (id: number) => setOpenId((prev) => (prev === id ? null : id))

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#333] mb-10">
          FAQ
        </h2>

        {items.length === 0 ? (
          <p className="text-gray-400">Вопросы появятся позже.</p>
        ) : (
          <div className="flex flex-col gap-3 max-w-3xl">
            {items.map((item) => {
              const isOpen = openId === item.id
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() => toggle(item.id)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
                  >
                    <span className="font-semibold text-[#333] text-[15px] leading-snug">
                      {item.question}
                    </span>
                    <span
                      className={`shrink-0 text-[#2583FF] text-xl transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    >
                      ↓
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-[#555] text-[15px] leading-relaxed border-t border-gray-100 pt-4">
                      {item.answer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
