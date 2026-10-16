'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * SplitText — кинетическая построчная анимация появления заголовков.
 * Автоматически вычисляет перенос строк (включая естественный soft-wrap в браузере)
 * и оборачивает каждую отдельную строку в собственную маску с overflow: hidden
 * с плавным ступенчатым (stagger) выходом строк.
 */
export function SplitText({
  text = '',
  className = '',
  startDelay = 0.05,
  stagger = 0.14,
  as: Component = 'span',
}: {
  text?: string;
  className?: string;
  startDelay?: number;
  stagger?: number;
  as?: React.ElementType;
}) {
  const containerRef = useRef<HTMLElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [lines, setLines] = useState<string[] | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Сплит по параграфам/словам для точного измерения в DOM
  const paragraphs = text.split('\n');
  const allWordsWithMeta = paragraphs.flatMap((p, pIdx) => {
    const words = p.split(/[ \t]+/).filter(Boolean);
    return words.map((w, wIdx) => ({
      word: w,
      pIdx,
      isLastInParagraph: wIdx === words.length - 1,
    }));
  });

  const computeLines = () => {
    if (!measureRef.current || !containerRef.current) return;
    const wordSpans = measureRef.current.querySelectorAll<HTMLElement>('[data-split-word]');
    if (!wordSpans.length) {
      setLines([text]);
      return;
    }

    const computed: string[] = [];
    let currentLineWords: string[] = [];
    let currentLineTop: number | null = null;
    let currentParagraphIdx: number = 0;

    for (let i = 0; i < wordSpans.length; i++) {
      const span = wordSpans[i];
      const pIdx = Number(span.getAttribute('data-pidx') || 0);
      const rect = span.getBoundingClientRect();
      const top = rect.top;

      const isNewParagraph = pIdx !== currentParagraphIdx;
      // Если слово перенеслось на новую строку (координата Y изменилась больше чем на 6px)
      const isWrapped = currentLineTop !== null && Math.abs(top - currentLineTop) > 6;

      if (currentLineTop === null) {
        currentLineTop = top;
        currentParagraphIdx = pIdx;
        currentLineWords.push(span.textContent?.trim() || '');
      } else if (isNewParagraph || isWrapped) {
        if (currentLineWords.length) {
          computed.push(currentLineWords.join(' '));
        }
        currentLineWords = [span.textContent?.trim() || ''];
        currentLineTop = top;
        currentParagraphIdx = pIdx;
      } else {
        currentLineWords.push(span.textContent?.trim() || '');
      }
    }

    if (currentLineWords.length) {
      computed.push(currentLineWords.join(' '));
    }

    setLines((prev) => {
      if (prev && prev.length === computed.length && prev.every((l, i) => l === computed[i])) {
        return prev;
      }
      return computed;
    });
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      setHasAnimated(true);
      return;
    }

    if (typeof document !== 'undefined' && document.fonts) {
      if (document.fonts.status === 'loaded') {
        computeLines();
      } else {
        document.fonts.ready.then(computeLines);
      }
    } else {
      computeLines();
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

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        computeLines();
      });
      resizeObserver.observe(el);
    }

    return () => {
      if (observer) observer.disconnect();
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('scroll', checkVisibility);
      window.removeEventListener('resize', checkVisibility);
    };
  }, [text]);

  // Завершение первичной анимации — после этого при адаптивном ресайзе строки перестраиваются плавно без перезапуска keyframes
  useEffect(() => {
    if (isVisible && !hasAnimated) {
      const lineCount = lines?.length || 1;
      const totalDuration = (startDelay + lineCount * stagger + 0.9) * 1000;
      const timer = setTimeout(() => {
        setHasAnimated(true);
      }, totalDuration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, hasAnimated, lines, startDelay, stagger]);

  // До вычисления в браузере (SSR) показываем строки по \n или полный текст
  const displayLines = lines || (text.includes('\n') ? text.split('\n') : [text]);

  return (
    <Component
      ref={containerRef}
      className={`split-text-root ${className}`.trim()}
      aria-label={text}
    >
      {/* Скрытый слой для измерения естественного переноса строк браузером */}
      <span
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          visibility: 'hidden',
          pointerEvents: 'none',
          opacity: 0,
          zIndex: -1,
          lineHeight: 'inherit',
          letterSpacing: 'inherit',
          fontSize: 'inherit',
          fontFamily: 'inherit',
          fontWeight: 'inherit',
        }}
      >
        {allWordsWithMeta.map((item, i) => (
          <span key={i}>
            <span
              data-split-word
              data-pidx={item.pIdx}
              style={{ display: 'inline', whiteSpace: 'nowrap' }}
            >
              {item.word}
            </span>
            {item.isLastInParagraph ? (
              item.pIdx < paragraphs.length - 1 ? <br /> : null
            ) : (
              ' '
            )}
          </span>
        ))}
      </span>

      {/* Отрендеренные построчные маски */}
      {displayLines.map((lineStr, idx) => (
        <span
          key={`${lineStr}-${idx}`}
          className={`split-text-line-mask ${isVisible ? 'is-visible' : ''}`}
          aria-hidden="true"
        >
          <span
            className="split-text-line-content"
            style={{
              animationDelay: hasAnimated ? '0s' : `${startDelay + idx * stagger}s`,
              transitionDelay: hasAnimated ? '0s' : `${startDelay + idx * stagger}s`,
              ...(hasAnimated ? { animation: 'none', transform: 'none', opacity: 1 } : {}),
            }}
          >
            {lineStr}
          </span>
        </span>
      ))}
    </Component>
  );
}

export default SplitText;
