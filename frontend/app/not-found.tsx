import Link from 'next/link';
import { Header } from '@/components/sections/Header';
import { Footer } from '@/components/sections/Footer';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="page__main">
        <section className="not-found-page">
          <div className="not-found-page__container">
            <div className="not-found-page__content">
              <span className="not-found-page__code">404</span>
              <h1 className="not-found-page__title">Страница не найдена</h1>
              <p className="not-found-page__desc">
                Кажется, запрашиваемая страница не существует или была перемещена.
              </p>
              <Link href="/" className="btn btn--primary-lg not-found-page__btn">
                На главную
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
