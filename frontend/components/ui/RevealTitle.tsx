'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * RevealTitle — анимация появления заголовка целиком сверху.
 * Оборачивает children, добавляет класс is-visible при попадании в viewport.
 * Дочерние элементы могут иметь разные классы (напр. акцентный цвет).
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

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const show = () => setIsVisible(true);

    // Сразу проверяем — вдруг уже в viewport
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 20 && rect.bottom > 20) {
      show();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show();
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0, rootMargin: '0px 0px -20px 0px' }
    );
    observer.observe(el);

    return () => observer.disconnect();
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
