import Link from 'next/link';
import { Header } from '@/components/sections/Header';
import { Contacts } from '@/components/sections/Contacts';
import { Footer } from '@/components/sections/Footer';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Tag } from '@/components/ui/Tag';
import { SplitText } from '@/components/ui/SplitText';
import { FadeImage } from '@/components/ui/FadeImage';

export const metadata = {
  title: 'Портфолио — Велкод',
  description: 'Примеры выполненных проектов студии Велкод: сайты, интеграции, чат-боты.',
};

interface PortfolioItem {
  id: number | string;
  slug: string | null;
  title: string;
  image_url: string | null;
  tags: string | null;
}

async function fetchPortfolio(): Promise<PortfolioItem[]> {
  const base =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8000';
  try {
    const res = await fetch(`${base}/api/portfolio`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function PortfolioPage() {
  const items: PortfolioItem[] = await fetchPortfolio();

  return (
    <>
      <Header currentPath="/portfolio" />
      <main className="page__main">
        <div className="portfolio-page">
          <div className="portfolio-page__container">
            <Breadcrumbs
              items={[
                { label: 'Главная', href: '/' },
                { label: 'Портфолио', current: true },
              ]}
            />

            <div className="portfolio-page__header">
              <h1 className="portfolio-page__title">
                <SplitText text="Портфолио" />
              </h1>
              <p className="portfolio-page__desc">
                Мы предлагаем широкий спектр digital-услуг: от создания чат-ботов до сложных сайтов с интеграциями 1С и Битрикс.
              </p>
            </div>

            <div className="portfolio-grid">
              {items.map((item) => (
                <article key={item.id} className="portfolio-card">
                  <Link
                    href={item.slug ? `/portfolio/${item.slug}` : '#'}
                    className="portfolio-card__preview img-skeleton"
                    aria-label={item.title}
                  >
                    <FadeImage
                      src={item.image_url ?? '/assets/case-placeholder.png'}
                      alt={`${item.title} — разработка сайтов под ключ, веб-дизайн студии Велкод`}
                      title={`${item.title} — проект Велкод Иркутск`}
                      className="portfolio-card__img"
                      loading="lazy"
                      decoding="async"
                    />
                  </Link>

                  <div className="portfolio-card__info">
                    <h2 className="portfolio-card__title">
                      <Link
                        href={item.slug ? `/portfolio/${item.slug}` : '#'}
                        className="portfolio-card__title-link"
                      >
                        {item.title}
                      </Link>
                    </h2>

                    <div className="portfolio-card__tags">
                      {(item.tags ?? '').split(',').filter(Boolean).map((tag, idx) => (
                        <Tag key={idx}>{tag.trim()}</Tag>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
        <Contacts />
      </main>
      <Footer />
    </>
  );
}
