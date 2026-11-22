import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/sections/Header';
import { Footer } from '@/components/sections/Footer';
import { CasePageClient, type CaseItem } from './CasePageClient';

const MOCK_CASE: CaseItem = {
  id: 1,
  slug: 'trattoria-landing',
  title: 'Trattoria — премиальный сайт ресторана',
  description:
    'Разработка современного адаптивного лендинга для ресторана итальянской кухни с интерактивным меню, онлайн-бронированием столов и плавной анимацией.',
  image_url: '/assets/case-trattoria.png',
  hero_image_url: '/assets/case-trattoria-hero.png',
  site_url: 'trattoria-demo.velcode.ru',
  tags: 'Веб-разработка, UI/UX дизайн, Next.js, Анимации, Адаптивная верстка',
  what_was_done:
    'Спроектировали уникальную дизайн-систему в минималистичном стиле, отражающую атмосферу уютной итальянской траттории.\n\nРазработали интерактивную карту меню с удобной фильтрацией блюд по категориям, аллергенам и калорийности.\n\nИнтегрировали систему онлайн-бронирования столиков в реальном времени с подтверждением через Telegram-бота.\n\nОптимизировали производительность и скорость загрузки страниц (Core Web Vitals: 95+ баллов).',
  screenshots: [
    '/assets/portfolio-site-preview-1.png',
    '/assets/portfolio-site-preview-2.png',
    '/assets/portfolio-site-preview-3.png',
    '/assets/case-elite-stay.png',
  ],
};

export const dynamic = 'force-dynamic';

async function fetchCase(slug: string): Promise<CaseItem | null> {
  const base =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8000';
  try {
    const res = await fetch(`${base}/api/portfolio/${slug}`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch {
    // network error
  }
  // Временная заглушка, если сервер/БД недоступны
  return { ...MOCK_CASE, slug };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await fetchCase(slug);
  if (!item) return {};
  const caseImage = item.hero_image_url || item.image_url || '/og-image.png';
  return {
    title: `${item.title} — Велкод`,
    description: item.description || `Кейс студии Велкод: ${item.title}`,
    alternates: {
      canonical: `/portfolio/${slug}`,
    },
    openGraph: {
      title: `${item.title} — Велкод`,
      description: item.description || `Кейс студии Велкод: ${item.title}`,
      url: `/portfolio/${slug}`,
      images: [
        {
          url: caseImage,
          alt: item.title,
        },
      ],
    },
  };
}

export default async function CasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await fetchCase(slug);
  if (!item) notFound();

  return (
    <>
      <Header currentPath="/portfolio" />
      <CasePageClient item={item} />
      <Footer />
    </>
  );
}
