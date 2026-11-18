import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ModalProvider } from '@/components/ModalProvider';
import { CompanyContactsProvider } from '@/components/CompanyContactsProvider';
import { SvgSprite } from '@/components/ui/SvgSprite';
import { CookieBanner } from '@/components/ui/CookieBanner';
import { AiChatWidget } from '@/components/ui/AiChatWidget';
import { MobileViewportFix } from '@/components/ui/MobileViewportFix';
import { YandexMetrika } from '@/components/analytics/YandexMetrika';
import { COMPANY_CONFIG } from '@/lib/company';
import { getCompanyContacts } from '@/lib/api';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://velcode.ru'),
  alternates: {
    canonical: '/',
  },
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
    siteName: 'Велкод',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Велкод — разработка сайтов и автоматизация бизнеса',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Велкод — разработка сайтов и автоматизация бизнеса',
    description:
      'Разработка сайтов под ключ, настройка рекламы и автоматизация бизнеса в Иркутске.',
    images: ['/og-image.png'],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const contacts = await getCompanyContacts();

  const legalName = contacts?.company_name || COMPANY_CONFIG.ipFullName;
  const email = contacts?.email || COMPANY_CONFIG.email;
  const phone = contacts?.phone || COMPANY_CONFIG.phone;
  const telegramBot = contacts?.telegram_url || COMPANY_CONFIG.telegramBot;

  const schemaGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'ProfessionalService'],
        '@id': 'https://velcode.ru/#organization',
        name: 'Велкод',
        legalName: legalName,
        url: 'https://velcode.ru',
        logo: 'https://velcode.ru/apple-touch-icon.png',
        image: 'https://velcode.ru/apple-touch-icon.png',
        email: email,
        telephone: phone,
        priceRange: '₽₽',
        sameAs: [telegramBot],
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: phone,
          contactType: 'customer service',
          areaServed: 'RU',
          availableLanguage: 'Russian',
        },
      },
      {
        '@type': 'WebSite',
        '@id': 'https://velcode.ru/#website',
        url: 'https://velcode.ru',
        name: 'Велкод — разработка сайтов и автоматизация бизнеса',
        description:
          'Разработка сайтов под ключ, реклама и автоматизация бизнеса в Иркутске. Битрикс24, 1С, чат-боты и ИИ.',
        publisher: {
          '@id': 'https://velcode.ru/#organization',
        },
        inLanguage: 'ru-RU',
      },
    ],
  };

  return (
    <html lang="ru">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
        />
      </head>
      <body className="page">
        <MobileViewportFix />
        <SvgSprite />
        <CompanyContactsProvider initialContacts={contacts}>
          <ModalProvider>
            {children}
            <CookieBanner />
            <AiChatWidget />
          </ModalProvider>
        </CompanyContactsProvider>
        <YandexMetrika />
      </body>
    </html>
  );
}
