import { notFound } from 'next/navigation';
import { Header } from '@/components/sections/Header';
import { Contacts } from '@/components/sections/Contacts';
import { Footer } from '@/components/sections/Footer';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SplitText } from '@/components/ui/SplitText';
import { Tag } from '@/components/ui/Tag';
import { BrowserMockup } from '@/components/ui/BrowserMockup';

interface CaseItem {
  id: number;
  slug: string | null;
  title: string;
  description: string;
  image_url: string | null;
  hero_image_url: string | null;
  site_url: string | null;
  tags: string | null;
}

async function fetchCase(slug: string): Promise<CaseItem | null> {
  const base =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000';
  try {
    const res = await fetch(`${base}/api/portfolio/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const item = await fetchCase(params.slug);
  if (!item) return {};
  return {
    title: `${item.title} — Велкод`,
    description: item.description || `Кейс студии Велкод: ${item.title}`,
  };
}

export default async function CasePage({
  params,
}: {
  params: { slug: string };
}) {
  const item = await fetchCase(params.slug);
  if (!item) notFound();

  const tags = (item!.tags ?? '')
    .split(',')
    .filter(Boolean)
    .map((t) => t.trim());

  return (
    <>
      <Header currentPath="/portfolio" />
      <main>
        <div className="case-page">
          <div className="case-page__container">
            <Breadcrumbs
              items={[
                { label: 'Главная', href: '/' },
                { label: 'Портфолио', href: '/portfolio' },
                { label: item!.title, current: true },
              ]}
            />

            <h1 className="case-page__title">
              <SplitText text={item!.title} />
            </h1>

            <div className="case-page__tags">
              {tags.map((tag, idx) => (
                <Tag key={idx}>{tag}</Tag>
              ))}
            </div>

            <p className="case-page__lead">{item!.description}</p>

            {item!.hero_image_url && (
              <div className="case-page__hero-wrap">
                <img
                  src={item!.hero_image_url}
                  alt={`${item!.title} — макет на ноутбуке`}
                  title={`${item!.title} — студия Велкод`}
                  className="case-page__hero-img"
                  loading="eager"
                />
              </div>
            )}

            <div className="case-page__mockup-wrap">
              <BrowserMockup url={item!.site_url || 'velcode.ru/'}>
                <img
                  src={item!.image_url || '/assets/case-placeholder.png'}
                  alt={`${item!.title} — интерфейс сайта в браузере`}
                  title={`Интерфейс сайта — ${item!.title}`}
                  loading="lazy"
                />
              </BrowserMockup>
            </div>
          </div>
        </div>
        <Contacts />
      </main>
      <Footer />
    </>
  );
}
