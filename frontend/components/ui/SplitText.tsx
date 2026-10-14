'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * SplitText — кинетическая построчная анимация появления заголовков.
 * Каждая строка/фрагмент выплывает снизу вверх из своего контейнера с overflow: hidden
 * без растяжения и сдвигов соседних элементов.
 * Премиальный, выверенный темп (editorial/curated digital studio).
 */
export function SplitText({
  text = '',
  className = '',
  startDelay = 0.05,
  as: Component = 'span',
}: {
  text?: string;
  className?: string;
  startDelay?: number;
  as?: React.ElementType;
}) {
  const containerRef = useRef<Element>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    let observer: IntersectionObserver | null = null;

    const triggerOnce = () => {
      setIsVisible(true);
      if (observer) observer.disconnect();
      window.removeEventListener('scroll', checkVisibility);
      window.removeEventListener('resize', checkVisibility);
    };

    const checkVisibility = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.top < window.innerHeight - 20 && rect.bottom > 20) {
        triggerOnce();
      }
    };

    checkVisibility();

    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              triggerOnce();
              break;
            }
          }
        },
        {
          threshold: 0,
          rootMargin: '0px 0px -20px 0px',
        }
      );
      observer.observe(el);
    }

    window.addEventListener('scroll', checkVisibility, { passive: true });
    window.addEventListener('resize', checkVisibility, { passive: true });

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('scroll', checkVisibility);
      window.removeEventListener('resize', checkVisibility);
    };
  }, []);

  return (
    <Component
      ref={containerRef}
      className={`split-text-line-mask ${isVisible ? 'is-visible' : ''} ${className}`.trim()}
      aria-label={text}
    >
      <span
        className="split-text-line-content"
        style={{
          animationDelay: `${startDelay}s`,
          transitionDelay: `${startDelay}s`,
        }}
      >
        {text}
      </span>
    </Component>
  );
}

export default SplitText;
