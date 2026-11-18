'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SliderArrow } from '@/components/ui/SliderArrow';
import { FadeImage } from '@/components/ui/FadeImage';
import { LightboxModal } from '@/components/ui/LightboxModal';

interface CaseScreenshotsProps {
  screenshots?: string[];
  title?: string;
}

export function CaseScreenshots({ screenshots, title = 'Галерея проекта' }: CaseScreenshotsProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [canGoNext, setCanGoNext] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // Состояние для перетаскивания мышкой (drag-to-scroll)
  const isMouseDownRef = useRef(false);
  const mouseStartXRef = useRef(0);
  const scrollStartLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanGoPrev(scrollLeft > 4);
    setCanGoNext(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = trackRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, screenshots]);

  // Drag-to-scroll мышкой
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // только ЛКМ
      isMouseDownRef.current = true;
      hasDraggedRef.current = false;
      mouseStartXRef.current = e.pageX;
      scrollStartLeftRef.current = el.scrollLeft;
      el.classList.add('is-dragging');
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current) return;
      const walk = e.pageX - mouseStartXRef.current;
      if (Math.abs(walk) > 4) {
        hasDraggedRef.current = true;
      }
      if (hasDraggedRef.current) {
        el.scrollLeft = scrollStartLeftRef.current - walk;
      }
    };

    const handleMouseUp = () => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        el.classList.remove('is-dragging');
        setTimeout(() => {
          hasDraggedRef.current = false;
        }, 50);
      }
    };

    el.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      el.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (!screenshots || screenshots.length === 0) {
    return null;
  }

  const handleScroll = (direction: 'prev' | 'next') => {
    const el = trackRef.current;
    if (!el) return;
    const firstItem = el.firstElementChild as HTMLElement | null;
    const itemWidth = firstItem ? firstItem.getBoundingClientRect().width : el.clientWidth * 0.8;
    const gap = 20;
    const scrollAmount = itemWidth + gap;

    el.scrollBy({
      left: direction === 'prev' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <>
      <section className="case-screenshots">
        <div className="case-page__container">
          <div className="case-screenshots__header">
            <h2 className="case-screenshots__title">{title}</h2>
            <div className="case-screenshots__controls">
              <SliderArrow
                direction="prev"
                disabled={!canGoPrev}
                onClick={() => handleScroll('prev')}
              />
              <SliderArrow
                direction="next"
                disabled={!canGoNext}
                onClick={() => handleScroll('next')}
              />
            </div>
          </div>

          <div className="case-screenshots__track" ref={trackRef}>
            {screenshots.map((src, idx) => (
              <div
                key={idx}
                className="case-screenshots__item img-skeleton"
                role="button"
                tabIndex={0}
                aria-label={`Открыть скриншот ${idx + 1}`}
                onClick={() => {
                  if (!hasDraggedRef.current) {
                    setActiveIdx(idx);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveIdx(idx);
                  }
                }}
              >
                <FadeImage
                  src={src}
                  alt={`${title} — экран ${idx + 1}`}
                  className="case-screenshots__img"
                  loading="lazy"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Полноэкранный просмотр через вынесенный компонент LightboxModal */}
      <LightboxModal
        isOpen={activeIdx !== null}
        onClose={() => setActiveIdx(null)}
        images={screenshots}
        activeIndex={activeIdx ?? 0}
        onNavigate={(newIdx) => setActiveIdx(newIdx)}
        title={title}
      />
    </>
  );
}
