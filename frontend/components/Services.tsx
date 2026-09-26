'use client'

import { useState } from 'react'
import type { Category, Service } from '@/lib/api'

type Props = {
  categories: Category[]
  services: Service[]
}

function formatPrice(full: number, discount: number | null, unit: string) {
  const price = discount ?? full
  return `от ${price.toLocaleString('ru-RU')} ₽ / ${unit}`
}

export default function Services({ categories, services }: Props) {
  const [activeId, setActiveId] = useState<number | null>(
    categories[0]?.id ?? null,
  )

  const visible =
    activeId === null
      ? services
      : services.filter((s) => s.categories.some((c) => c.id === activeId))

  return (
    <section id="service" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#333] mb-4">
          Наши услуги
        </h2>
        <p className="text-[#666] text-lg mb-10 max-w-2xl">
          Веб-разработка и&nbsp;автоматизация процессов. От&nbsp;кастомного
          UI/UX-дизайна, продвижения и&nbsp;чат-ботов до&nbsp;внедрения ИИ,
          интеграций с&nbsp;1С и&nbsp;Битрикс24.
        </p>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveId(cat.id)}
              className={`px-4 py-2 rounded-full text-[14px] font-medium transition-colors border ${
                activeId === cat.id
                  ? 'bg-[#2583FF] text-white border-[#2583FF]'
                  : 'bg-white text-[#333] border-gray-200 hover:border-[#2583FF] hover:text-[#2583FF]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Cards */}
        {visible.length === 0 ? (
          <p className="text-gray-400">Услуги в этом разделе появятся позже.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((s) => (
              <div
                key={s.id}
                className="border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                {s.image_url && (
                  <div className="h-44 overflow-hidden bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.image_url}
                      alt={s.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-semibold text-[#333] text-[16px] mb-2">
                    {s.title}
                  </h3>
                  {s.description && (
                    <p className="text-[#666] text-[14px] mb-4 flex-1 line-clamp-3">
                      {s.description}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-[#2583FF] font-semibold text-[15px]">
                      {formatPrice(s.price_full, s.price_discount, s.unit)}
                    </span>
                    <a
                      href="/#contacts"
                      className="text-[13px] text-[#2583FF] hover:underline font-medium"
                    >
                      Подробнее →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
