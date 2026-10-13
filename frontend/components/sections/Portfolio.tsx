'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { PORTFOLIO_DATA } from '@/lib/siteData';

export function Portfolio() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const stack = sectionRef.current ? sectionRef.current.querySelector('#portfolioStack') : null;
    const urlLabel = sectionRef.current ? sectionRef.current.querySelector('#portfolioUrl') : null;
    const slides = stack ? Array.from(stack.children) as HTMLElement[] : [];
    if (slides.length < 2) return;

    const HOLD_MS = 3200;
    const slideMs = parseFloat(getComputedStyle(stack as Element).getPropertyValue('--slide-duration')) || 1100;

    const pauseReasons = new Set<string>(['loading', 'offscreen']);
    let index = 0;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let timerStartedAt = 0;
    let timeLeft = HOLD_MS;

    function run() {
      if (timerId !== null) return;
      timerStartedAt = performance.now();
      timerId = setTimeout(advance, timeLeft);
    }

    function halt() {
      if (timerId === null) return;
      clearTimeout(timerId);
      timerId = null;
      timeLeft = Math.max(timeLeft - (performance.now() - timerStartedAt), 0);
    }

    function setPaused(reason: string, paused: boolean) {
      if (paused) pauseReasons.add(reason);
      else pauseReasons.delete(reason);
      if (pauseReasons.size) halt();
      else run();
    }

    function advance() {
      timerId = null;
      const next = (index + 1) % slides.length;

      slides.forEach((slide, i) => {
        if (i === next) slide.dataset.state = 'current';
        else if (i === index) slide.dataset.state = 'leaving';
        else delete slide.dataset.state;
        slide.setAttribute('aria-hidden', String(i !== next));
      });

      if (urlLabel && (slides[next] as HTMLElement).dataset.url) {
        urlLabel.textContent = (slides[next] as HTMLElement).dataset.url || '';
      }

      index = next;
      timeLeft = HOLD_MS + slideMs;
      run();
    }

    Promise.all(
      slides.map((slide) => {
        const img = slide.querySelector('img') as HTMLImageElement | null;
        return img && img.decode ? img.decode().catch(() => {}) : Promise.resolve();
      })
    ).then(() => setPaused('loading', false));

    let observer: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => {
        setPaused('offscreen', !entry.isIntersecting);
      }, { threshold: 0.3 });
      observer.observe(stack as Element);
    } else {
      setPaused('offscreen', false);
    }

    const onVisibility = () => setPaused('hidden', document.hidden);
    document.addEventListener('visibilitychange', onVisibility);

    const onPointerEnter = () => setPaused('hover', true);
    const onPointerLeave = () => setPaused('hover', false);

    if (window.matchMedia('(hover: hover)').matches) {
      (stack as Element).addEventListener('pointerenter', onPointerEnter);
      (stack as Element).addEventListener('pointerleave', onPointerLeave);
    }

    return () => {
      halt();
      if (observer) observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      (stack as Element).removeEventListener('pointerenter', onPointerEnter);
      (stack as Element).removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return (
    <section className="portfolio" id="portfolio" ref={sectionRef}>
      <div className="portfolio__container">
        <div className="portfolio__folder">
          <div className="portfolio__folder-tab" aria-hidden="true"></div>
          <div className="portfolio__folder-card">
            <div className="portfolio__browser">
              <div className="browser-bar" aria-hidden="true">
                <div className="browser-bar__side">
                  <span className="browser-bar__dots">
                    <span className="browser-bar__dot browser-bar__dot--close"></span>
                    <span className="browser-bar__dot browser-bar__dot--minimize"></span>
                    <span className="browser-bar__dot browser-bar__dot--zoom"></span>
                  </span>
                  <svg className="browser-bar__icon browser-bar__icon--hide-sm" viewBox="0 0 16 16">
                    <rect x="1.5" y="3" width="13" height="10" rx="2" />
                    <path d="M6 3v10" />
                  </svg>
                  <svg className="browser-bar__icon browser-bar__icon--hide-sm" viewBox="0 0 16 16">
                    <path d="M10 3.5 5.5 8l4.5 4.5" />
                  </svg>
                  <svg className="browser-bar__icon browser-bar__icon--muted browser-bar__icon--hide-sm" viewBox="0 0 16 16">
                    <path d="M6 3.5 10.5 8 6 12.5" />
                  </svg>
                </div>
                <div className="browser-bar__center">
                  <svg className="browser-bar__icon browser-bar__icon--hide-sm" viewBox="0 0 16 16">
                    <path d="M8 1.8 13 3.6v4c0 3.1-2.1 5.4-5 6.6-2.9-1.2-5-3.5-5-6.6v-4z" />
                    <path d="M8 1.8v12.4" />
                  </svg>
                  <div className="browser-bar__address">
                    <svg className="browser-bar__lock" viewBox="0 0 16 16">
                      <rect x="3.5" y="7" width="9" height="7" rx="1.5" />
                      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
                    </svg>
                    <span className="browser-bar__url" id="portfolioUrl">
                      {PORTFOLIO_DATA[0].url}
                    </span>
                    <svg className="browser-bar__reload" viewBox="0 0 16 16">
                      <path d="M12.5 8a4.5 4.5 0 1 1-1.3-3.2" />
                      <path d="M12 2.5v2.8H9.2" />
                    </svg>
                  </div>
                </div>
                <div className="browser-bar__side browser-bar__side--end">
                  <svg className="browser-bar__icon" viewBox="0 0 16 16">
                    <path d="M8 1.5v8M5.2 4.3 8 1.5l2.8 2.8" />
                    <path d="M5 6.5H3.5v8h9v-8H11" />
                  </svg>
                  <svg className="browser-bar__icon" viewBox="0 0 16 16">
                    <path d="M8 3v10M3 8h10" />
                  </svg>
                  <svg className="browser-bar__icon" viewBox="0 0 16 16">
                    <rect x="2" y="5" width="9" height="9" rx="1.5" />
                    <path d="M5 2.5h7a1.5 1.5 0 0 1 1.5 1.5v7" />
                  </svg>
                </div>
              </div>
              <div className="portfolio__stack" id="portfolioStack">
                {PORTFOLIO_DATA.map((item, idx) => (
                  <article
                    key={idx}
                    className="portfolio__slide"
                    data-state={idx === 0 ? 'current' : undefined}
                    data-url={item.url}
                    aria-hidden={idx !== 0 ? 'true' : 'false'}
                  >
                    <Link href={item.link} className="portfolio__slide-link" aria-label={item.title}>
                      <img
                        src={item.img}
                        alt={`${item.title} — кейс веб-разработки и создания сайтов digital-студии Велкод`}
                        title={`${item.title} — веб-студия Велкод Иркутск`}
                        className="portfolio__mockup-img"
                        decoding="async"
                        loading={idx === 0 ? 'eager' : 'lazy'}
                      />
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="portfolio__info">
          <h2 className="portfolio__title">Наши кейсы</h2>
          <p className="portfolio__description">
            Мы предлагаем широкий спектр digital-услуг: от создания чат-ботов до сложных сайтов с интеграциями 1С и Битрикс.
          </p>
          <Link href="/portfolio" className="btn btn--service-link portfolio__more">
            <span className="btn__round-icon">
              <svg className="icon btn__arrow" aria-hidden="true">
                <use href="#icon-arrow" />
              </svg>
            </span>
            <span className="btn__label">Смотреть все работы</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
