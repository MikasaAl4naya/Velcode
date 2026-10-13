import Link from 'next/link';
import { Header } from '@/components/sections/Header';
import { Footer } from '@/components/sections/Footer';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PORTFOLIO_PAGE_ITEMS } from '@/lib/siteData';

export const metadata = {
  title: 'Портфолио — Велкод',
  description: 'Примеры выполненных проектов студии Велкод: сайты, интеграции, чат-боты.',
};

export default function PortfolioPage() {
  return (
    <>
      <Header currentPath="/portfolio" />
      <main>
        <div className="portfolio-page">
          <div className="portfolio-page__container">
            <Breadcrumbs
              items={[
                { label: 'Главная', href: '/' },
                { label: 'Портфолио', current: true },
              ]}
            />

            <div className="portfolio-page__header">
              <h1 className="portfolio-page__title">Портфолио</h1>
              <p className="portfolio-page__desc">
                Мы предлагаем широкий спектр digital-услуг: от создания чат-ботов до сложных сайтов с интеграциями 1С и Битрикс.
              </p>
            </div>

            <div className="portfolio-grid">
              {PORTFOLIO_PAGE_ITEMS.map((item) => (
                <article
                  key={item.id}
                  className={`portfolio-card ${item.empty ? 'portfolio-card--empty' : ''}`}
                >
                  <Link
                    href={item.link}
                    className="portfolio-card__preview"
                    aria-label={item.title}
                  >
                    <img
                      src={item.img}
                      alt={`${item.title} — разработка сайтов под ключ, веб-дизайн студии Велкод`}
                      title={`${item.title} — проект Велкод Иркутск`}
                      className="portfolio-card__img"
                      loading="lazy"
                      decoding="async"
                    />
                  </Link>

                  <div className="portfolio-card__info">
                    <h2 className="portfolio-card__title">
                      <Link href={item.link} className="portfolio-card__title-link">
                        {item.title}
                      </Link>
                    </h2>

                    <div className="portfolio-card__tags">
                      {item.tags.map((tag, idx) => (
                        <span key={idx} className="portfolio-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
