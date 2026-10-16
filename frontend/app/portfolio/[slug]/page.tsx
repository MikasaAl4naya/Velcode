import { notFound } from 'next/navigation';
import { Header } from '@/components/sections/Header';
import { Contacts } from '@/components/sections/Contacts';
import { Footer } from '@/components/sections/Footer';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SplitText } from '@/components/ui/SplitText';
import { Tag } from '@/components/ui/Tag';
import { BrowserMockup } from '@/components/ui/BrowserMockup';
import { FadeImage } from '@/components/ui/FadeImage';

interface CaseItem {
  id: number;
  slug: string | null;
  title: string;
  description: string;
  image_url: string | null;
  hero_image_url: string | null;
  site_url: string | null;
  tags: string | null;
  what_was_done: string | null;
}

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
}) {
  const { slug } = await params;
  const item = await fetchCase(slug);
  if (!item) return {};
  return {
    title: `${item.title} — Велкод`,
    description: item.description || `Кейс студии Велкод: ${item.title}`,
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

  const tags = (item!.tags ?? '')
    .split(',')
    .filter(Boolean)
    .map((t) => t.trim());

  return (
    <>
      <Header currentPath="/portfolio" />
      <main className="page__main">
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
              <div className="case-page__hero-wrap img-skeleton">
                <FadeImage
                  src={item!.hero_image_url}
                  alt={`${item!.title} — макет на ноутбуке`}
                  title={`${item!.title} — студия Велкод`}
                  className="case-page__hero-img"
                  loading="eager"
                />
              </div>
            )}

            {item!.what_was_done && (
              <div className="case-page__what">
                <h2 className="case-page__what-title">Что было сделано</h2>
                <div className="case-page__what-body">
                  {item!.what_was_done.split(/(?:\r?\n){2,}/).filter(Boolean).map((para, idx) => (
                    <p key={idx} className="case-page__what-text">{para}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="case-page__mockup-wrap">
              <BrowserMockup url={item!.site_url || 'velcode.ru/'} scrollable>
                <FadeImage
                  src={item!.image_url || '/assets/case-example.png'}
                  alt={`${item!.title} — интерфейс сайта в браузере`}
                  title={`Интерфейс сайта — ${item!.title}`}
                  loading="lazy"
                  draggable={false}
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
