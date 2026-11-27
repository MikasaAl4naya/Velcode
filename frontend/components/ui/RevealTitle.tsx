'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * RevealTitle — анимация появления заголовка целиком сверху.
 * Оборачивает children, добавляет класс is-visible при попадании в viewport.
 */
export function RevealTitle({
  children,
  className = '',
  as: Component = 'h2',
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Если пользователь предпочитает без анимаций — сразу показываем
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      setIsVisible(true);
    };

    // Страховочный таймер: через 1.5 сек показываем в любом случае
    const fallbackTimer = setTimeout(show, 1500);

    // Простая проверка: уже в зоне видимости?
    const check = () => {
      if (!ref.current) return false;
      const rect = ref.current.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    };

    if (check()) {
      show();
      clearTimeout(fallbackTimer);
      return;
    }

    // IntersectionObserver без отрицательных rootMargin
    let observer: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              show();
              clearTimeout(fallbackTimer);
              observer?.disconnect();
              break;
            }
          }
        },
        { threshold: 0.01 }
      );
      observer.observe(el);
    }

    // Scroll-фолбэк для старых браузеров / edge-кейсов
    const onScroll = () => {
      if (check()) {
        show();
        clearTimeout(fallbackTimer);
        window.removeEventListener('scroll', onScroll, true);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });

    return () => {
      clearTimeout(fallbackTimer);
      observer?.disconnect();
      window.removeEventListener('scroll', onScroll, true);
    };
  }, []);

  return (
    <Component
      ref={ref}
      className={`reveal-title ${isVisible ? 'is-visible' : ''} ${className}`.trim()}
    >
      {children}
    </Component>
  );
}

export default RevealTitle;
