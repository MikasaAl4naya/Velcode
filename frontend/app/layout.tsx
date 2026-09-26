import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Велкод — разработка сайтов и автоматизация бизнеса',
  description:
    'Велкод: разработка сайтов под ключ, настройка рекламы и автоматизация бизнеса в Иркутске. Битрикс24, 1С, чат-боты и ИИ-ассистенты. Оставьте заявку!',
  keywords:
    'разработка сайта, автоматизация бизнес процессов, создание ии-ассистентов, внедрение битрикс, сайт под ключ',
  openGraph: {
    title: 'Велкод — разработка сайтов и автоматизация бизнеса',
    description:
      'Разработка сайтов под ключ, настройка рекламы и автоматизация бизнеса в Иркутске.',
    url: 'https://velcode.ru',
    locale: 'ru_RU',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={montserrat.variable}>
      <body>{children}</body>
    </html>
  )
}
