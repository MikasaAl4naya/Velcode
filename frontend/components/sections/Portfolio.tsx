'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PORTFOLIO_DATA } from '@/lib/siteData';
import { SplitText } from '@/components/ui/SplitText';
import { BrowserMockup } from '@/components/ui/BrowserMockup';

export function Portfolio() {
  const sectionRef = useRef<HTMLElement>(null);
  const [currentUrl, setCurrentUrl] = useState(PORTFOLIO_DATA[0].url);

  useEffect(() => {
    const stack = sectionRef.current ? sectionRef.current.querySelector('#portfolioStack') : null;
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

      if (slides[next].dataset.url) {
        setCurrentUrl(slides[next].dataset.url!);
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
            <BrowserMockup url={currentUrl} className="portfolio__browser">
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
            </BrowserMockup>
          </div>
        </div>
        <div className="portfolio__info">
          <h2 className="portfolio__title">
            <SplitText text="Наши кейсы" />
          </h2>
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
