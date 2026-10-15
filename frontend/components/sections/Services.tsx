'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SERVICES_DATA, CONSULTATION_SERVICE, type ServiceData } from '@/lib/siteData';
import { ServiceCard } from '@/components/ui/ServiceCard';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SplitText } from '@/components/ui/SplitText';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type ServicesProps = {
  isStandalone?: boolean;
  items?: ServiceData[];
};

export function Services({ isStandalone = false, items }: ServicesProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [canGoPrev, setCanGoPrev] = useState(false);
  const [canGoNext, setCanGoNext] = useState(true);

  const stateRef = useRef({
    target: 0,
    current: 0,
    maxShift: 0,
    stops: [0],
    frameId: null as number | null,
    lastFrameTime: 0,
    hasCompleted: false,
    stickyTop: 0,
  });

  const syncArrows = useCallback(() => {
    const s = stateRef.current;
    if (!s.maxShift) {
      setCanGoPrev(false);
      setCanGoNext(true);
      return;
    }
    setCanGoPrev(s.target > 1);
    setCanGoNext(s.target < s.maxShift - 1);
  }, []);

  const renderTransform = useCallback(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${-stateRef.current.current}px, 0, 0)`;
    }
  }, []);

  const tick = useCallback((now: number) => {
    const s = stateRef.current;
    const SMOOTH_TAU = 140;
    const dt = Math.min(now - s.lastFrameTime, 64);
    s.lastFrameTime = now;
    s.current += (s.target - s.current) * (1 - Math.exp(-dt / SMOOTH_TAU));

    if (Math.abs(s.target - s.current) < 0.25) {
      s.current = s.target;
      s.frameId = null;
    } else {
      s.frameId = requestAnimationFrame(tick);
    }
    renderTransform();
  }, [renderTransform]);

  const setTarget = useCallback((value: number) => {
    const s = stateRef.current;
    s.target = clamp(value, 0, s.maxShift);
    syncArrows();
    if (s.target >= s.maxShift - 1) {
      s.hasCompleted = true;
    }
    if (s.frameId === null) {
      s.lastFrameTime = performance.now();
      s.frameId = requestAnimationFrame(tick);
    }
  }, [syncArrows, tick]);

  const goTo = (dir: number) => {
    const s = stateRef.current;
    if (!s.maxShift) return;
    const from = s.target;
    const next =
      dir > 0
        ? s.stops.find((stop) => stop > from + 1)
        : [...s.stops].reverse().find((stop) => stop < from - 1);
    if (next !== undefined) {
      setTarget(next);
    }
  };

  const measure = useCallback(() => {
    const isMobile = window.matchMedia('(max-width: 767.98px)').matches;
    const isShort = window.matchMedia('(max-height: 560px)').matches;
    const track = trackRef.current;
    const container = containerRef.current;
    const sticky = stickyRef.current;
    const s = stateRef.current;

    if (!track || !container || !sticky) return;

    if (isMobile || isShort) {
      s.maxShift = 0;
      track.style.transform = '';
      track.style.minHeight = '';
      sticky.style.minHeight = '';
      if (sectionRef.current) sectionRef.current.style.height = '';
      syncArrows();
      return;
    }

    track.style.transform = 'none';
    track.style.minHeight = '';
    const cards = [...track.querySelectorAll('.service-card')] as HTMLElement[];
    if (cards.length === 0) return;

    let maxCardHeight = 0;
    cards.forEach((card) => {
      const h = card.offsetHeight;
      if (h > maxCardHeight) maxCardHeight = h;
    });

    const headerEl = sticky.querySelector('.services__header') as HTMLElement | null;
    const headerHeight = headerEl
      ? headerEl.offsetHeight + (parseFloat(getComputedStyle(headerEl).marginBottom) || 0)
      : (container.offsetHeight || 0);

    const sectionPad =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--section-pad')) ||
      parseFloat(getComputedStyle(sticky).paddingTop) ||
      0;

    if (maxCardHeight > 0) {
      const minStickyHeight = Math.round(sectionPad * 2 + headerHeight + maxCardHeight);
      sticky.style.minHeight = `${minStickyHeight}px`;
    }

    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const gridRight = container.getBoundingClientRect().right - parseFloat(getComputedStyle(container).paddingRight);
    const lastCardRight = cards[cards.length - 1].getBoundingClientRect().right;

    s.stickyTop = parseFloat(getComputedStyle(sticky).top) || 0;
    const cardStep = cards[0].offsetWidth + gap;
    s.maxShift = Math.max(0, lastCardRight - gridRight);

    s.stops = [];
    for (let x = 0; x < s.maxShift - 1; x += cardStep) {
      s.stops.push(x);
    }
    s.stops.push(s.maxShift);

    if (sectionRef.current) sectionRef.current.style.height = '';

    s.target = clamp(s.target, 0, s.maxShift);
    s.current = clamp(s.current, 0, s.maxShift);
    renderTransform();
    syncArrows();
  }, [renderTransform, syncArrows]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);

    let resizeObserver: ResizeObserver | null = null;
    if ('ResizeObserver' in window) {
      let queued = false;
      resizeObserver = new ResizeObserver(() => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          measure();
        });
      });
      resizeObserver.observe(document.body);
    }

    if (isStandalone) {
      let touchStartX = 0;
      let touchLastX = 0;
      let isTouchOnServices = false;

      const handleTouchStart = (event: TouchEvent) => {
        const touch = event.touches[0];
        if (!touch) return;
        touchStartX = touchLastX = touch.clientX;
        isTouchOnServices = sectionRef.current ? sectionRef.current.contains(event.target as Node) : false;
      };

      const handleTouchMove = (event: TouchEvent) => {
        const s = stateRef.current;
        if (s.maxShift <= 0 || !event.touches || event.touches.length === 0) return;
        const currentX = event.touches[0].clientX;
        const stepDiffX = touchLastX - currentX;
        touchLastX = currentX;

        if (isTouchOnServices && Math.abs(touchStartX - currentX) > 8) {
          setTarget(s.target + stepDiffX * 1.3);
        }
      };

      window.addEventListener('touchstart', handleTouchStart, { passive: true });
      window.addEventListener('touchmove', handleTouchMove, { passive: true });

      return () => {
        window.removeEventListener('resize', measure);
        window.removeEventListener('load', measure);
        if (resizeObserver) resizeObserver.disconnect();
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
      };
    }

    // Global wheel hooks for main page scroll integration
    (window as any).__getServicesLockY = () => {
      const s = stateRef.current;
      const isMobile = window.matchMedia('(max-width: 767.98px)').matches;
      const isShort = window.matchMedia('(max-height: 560px)').matches;
      if (s.hasCompleted || isMobile || isShort || s.maxShift <= 0) return null;

      const advSection = document.querySelector('.advantages');
      if (advSection) {
        const advRect = advSection.getBoundingClientRect();
        return window.scrollY + advRect.top - window.innerHeight;
      }

      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const lockTopY = window.scrollY + rect.top - s.stickyTop;
        return lockTopY - 135;
      }

      return null;
    };

    (window as any).__handleServicesWheel = (event: WheelEvent) => {
      const s = stateRef.current;
      const isMobile = window.matchMedia('(max-width: 767.98px)').matches;
      const isShort = window.matchMedia('(max-height: 560px)').matches;
      if (s.hasCompleted || isMobile || isShort || s.maxShift <= 0) return false;

      const delta = event.deltaMode === 1 ? event.deltaY * 40 : event.deltaY;
      if (Math.abs(delta) < 1) return false;

      if (delta > 0) {
        const lockY = (window as any).__getServicesLockY();
        if (lockY !== null && window.scrollY >= lockY - 5 && s.target < s.maxShift - 1) {
          event.preventDefault();
          if (typeof (window as any).__stopSmoothWheel === 'function') {
            (window as any).__stopSmoothWheel();
          }
          setTarget(s.target + delta);
          return true;
        }
      }

      return false;
    };

    (window as any).__completeServices = () => {
      const s = stateRef.current;
      s.hasCompleted = true;
      s.target = s.maxShift;
      s.current = s.maxShift;
      renderTransform();
      syncArrows();
    };

    (window as any).__resetServices = () => {
      const s = stateRef.current;
      s.hasCompleted = false;
      s.target = 0;
      s.current = 0;
      renderTransform();
      syncArrows();
    };

    let touchStartX = 0;
    let touchStartY = 0;
    let touchLastX = 0;
    let touchLastY = 0;
    let touchDirection: 'horizontal' | 'vertical' | null = null;
    let isTouchOnServices = false;

    const handleTouchStart = (event: TouchEvent) => {
      const s = stateRef.current;
      const isMobile = window.matchMedia('(max-width: 767.98px)').matches;
      const isShort = window.matchMedia('(max-height: 560px)').matches;
      if (isMobile || isShort || s.hasCompleted) return;
      const touch = event.touches[0];
      if (!touch) return;
      touchStartX = touchLastX = touch.clientX;
      touchStartY = touchLastY = touch.clientY;
      touchDirection = null;
      isTouchOnServices = sectionRef.current ? sectionRef.current.contains(event.target as Node) : false;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const s = stateRef.current;
      const isMobile = window.matchMedia('(max-width: 767.98px)').matches;
      const isShort = window.matchMedia('(max-height: 560px)').matches;
      if (s.hasCompleted || isMobile || isShort || s.maxShift <= 0) return;
      if (!event.touches || event.touches.length === 0) return;

      const currentX = event.touches[0].clientX;
      const currentY = event.touches[0].clientY;
      const totalDiffX = touchStartX - currentX;
      const totalDiffY = touchStartY - currentY;
      const stepDiffX = touchLastX - currentX;
      const stepDiffY = touchLastY - currentY;

      touchLastX = currentX;
      touchLastY = currentY;

      if (!touchDirection && (Math.abs(totalDiffX) > 6 || Math.abs(totalDiffY) > 6)) {
        touchDirection = Math.abs(totalDiffX) >= Math.abs(totalDiffY) ? 'horizontal' : 'vertical';
      }

      if (touchDirection === 'horizontal') {
        if (isTouchOnServices) {
          if (event.cancelable) event.preventDefault();
          setTarget(s.target + stepDiffX * 1.3);
        }
        return;
      }

      if (touchDirection === 'vertical' && totalDiffY > 0) {
        const lockY = (window as any).__getServicesLockY();
        if (lockY !== null && s.target < s.maxShift - 1) {
          if (window.scrollY >= lockY - 5) {
            if (event.cancelable) {
              event.preventDefault();
              setTarget(s.target + stepDiffY * 1.4);
            }
          }
        }
      }
    };

    const handleScroll = () => {
      const s = stateRef.current;
      const isMobile = window.matchMedia('(max-width: 767.98px)').matches;
      const isShort = window.matchMedia('(max-height: 560px)').matches;
      if (s.hasCompleted || isMobile || isShort || s.maxShift <= 0) return;
      const lockY = (window as any).__getServicesLockY();
      if (lockY !== null && s.target < s.maxShift - 1) {
        if (window.scrollY > lockY) {
          const overshoot = window.scrollY - lockY;
          window.scrollTo({ top: lockY, behavior: 'instant' });
          setTarget(s.target + overshoot * 1.2);
        }
      }
    };

    const handleSectionWheel = (event: Event) => {
      (window as any).__handleServicesWheel(event as WheelEvent);
    };

    const sectionEl = sectionRef.current;
    if (sectionEl) {
      sectionEl.addEventListener('wheel', handleSectionWheel, { passive: false });
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('load', measure);
      if (resizeObserver) resizeObserver.disconnect();
      if (sectionEl) sectionEl.removeEventListener('wheel', handleSectionWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('scroll', handleScroll);
      if (trackRef.current) trackRef.current.style.minHeight = '';
      if (stickyRef.current) stickyRef.current.style.minHeight = '';
      delete (window as any).__getServicesLockY;
      delete (window as any).__handleServicesWheel;
      delete (window as any).__completeServices;
      delete (window as any).__resetServices;
    };
  }, [measure, setTarget, isStandalone]);

  const allCards = [...(items ?? SERVICES_DATA), CONSULTATION_SERVICE];

  return (
    <section
      className={`services ${isStandalone ? 'services--standalone' : ''}`}
      id={isStandalone ? undefined : 'services'}
      ref={sectionRef}
    >
      <div className="services__sticky" ref={stickyRef}>
        <div className="services__container" ref={containerRef}>
          {isStandalone && (
            <Breadcrumbs
              items={[
                { label: 'Главная', href: '/' },
                { label: 'Услуги', current: true },
              ]}
            />
          )}
          <div className="services__header">
            {isStandalone ? (
              <h1 className="services__title">
                <SplitText text="Наши услуги" />
              </h1>
            ) : (
              <h2 className="services__title">
                <SplitText text="Наши услуги" />
              </h2>
            )}
            <div className="services__header-side">
              <p className="services__desc">
                Мы предлагаем широкий спектр digital-услуг: от создания чат-ботов до сложных сайтов с интеграциями 1С и Битрикс.
              </p>
              <div className="services__controls">
                <button
                  className="services__control-btn"
                  type="button"
                  aria-label="Назад"
                  disabled={!canGoPrev}
                  onClick={() => goTo(-1)}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M12 4L6 10L12 16"
                      stroke="#171819"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  className="services__control-btn"
                  type="button"
                  aria-label="Вперёд"
                  disabled={!canGoNext}
                  onClick={() => goTo(1)}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M8 4L14 10L8 16"
                      stroke="#171819"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="services__track-wrapper">
          <div className="services__track" id="servicesScroll" ref={trackRef}>
            {allCards.map((card) => (
              <React.Fragment key={card.num}>
                <span className="services__snap" aria-hidden="true"></span>
                <ServiceCard card={card} />
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
