import type { Metadata } from 'next';
import './globals.css';
import { ModalProvider } from '@/components/ModalProvider';
import { SvgSprite } from '@/components/ui/SvgSprite';
import { CookieBanner } from '@/components/ui/CookieBanner';

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="page">
        <SvgSprite />
        <ModalProvider>
          {children}
          <CookieBanner />
        </ModalProvider>
      </body>
    </html>
  );
}
