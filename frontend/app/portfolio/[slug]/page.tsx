import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Header } from '@/components/sections/Header';
import { Footer } from '@/components/sections/Footer';
import { CasePageClient, type CaseItem } from './CasePageClient';

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
  return null;
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
  if (!item) {
    redirect('/portfolio');
  }

  return (
    <>
      <Header currentPath="/portfolio" />
      <CasePageClient item={item} />
      <Footer />
    </>
  );
}
