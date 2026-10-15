'use client';

import { useEffect, useRef, useState } from 'react';
import { useModal } from '@/hooks/useModal';
import { HERO_TAGS } from '@/lib/siteData';
import { SplitText } from '@/components/ui/SplitText';
import { Tag } from '@/components/ui/Tag';
import { HeroModel } from '@/components/ui/HeroModel';

export function Hero() {
  const { openModal } = useModal();
  const heroRef = useRef<HTMLElement>(null);
  const torusRef = useRef<HTMLDivElement>(null);
  const [isTabletRatio, setIsTabletRatio] = useState(false);

  useEffect(() => {
    const checkClearance = () => {
      const isMobile = window.matchMedia('(max-width: 767.98px)').matches;
      if (isMobile) {
        setIsTabletRatio(false);
        return;
      }

      const torus = torusRef.current;
      if (!torus) return;

      const w = window.innerWidth;
      const torusRect = torus.getBoundingClientRect();
      const leftRatio = torusRect.left / w;

      setIsTabletRatio(leftRatio < 0.20);
    };

    checkClearance();
    window.addEventListener('resize', checkClearance, { passive: true });
    window.addEventListener('orientationchange', checkClearance, { passive: true });
    return () => {
      window.removeEventListener('resize', checkClearance);
      window.removeEventListener('orientationchange', checkClearance);
    };
  }, []);

  return (
    <section
      className={`hero ${isTabletRatio ? 'is-tablet-ratio' : ''}`}
      id="main"
      ref={heroRef}
    >
      <div className="hero__container">
        {/* Фоновая 3D-модель: справа на всю высоту контейнера */}
        <div className="hero__bg-torus" ref={torusRef} aria-hidden="true">
          <HeroModel />
        </div>

        {/* Верхняя часть: заголовки и кнопки */}
        <div className="hero__top-row">
          <div className="hero__info">
            <div className="hero__title-wrap">
              <h1 className="hero__title">
                <SplitText
                  text="Цифровые решения"
                  className="hero__title-line hero__title-line--accent"
                  startDelay={0.01}
                />
                <SplitText
                  text="для вашего бизнеса"
                  className="hero__title-line"
                  startDelay={0.24}
                />
              </h1>
              <p className="hero__description">
                Веб-разработка и автоматизация процессов. Создадим и&nbsp;поддержим всю digital-инфраструктуру вашей компании.
              </p>
            </div>

            <div className="hero__actions">
              <button
                type="button"
                className="btn btn--primary-lg hero__button"
                onClick={() => openModal()}
              >
                Получить консультацию
              </button>
              <a href="#services" className="btn btn--service-link hero__button">
                <span className="btn__round-icon">
                  <svg className="icon btn__arrow" aria-hidden="true">
                    <use href="#icon-arrow" />
                  </svg>
                </span>
                <span className="btn__label">Наши услуги</span>
              </a>
            </div>
          </div>
        </div>

        {/* Нижняя единая линия: теги слева и карточка по одной оси */}
        <div className="hero__bottom-row">
          <div className="hero__tags">
            {HERO_TAGS.map((row, idx) => (
              <div key={idx} className="hero__tags-row">
                {row.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            ))}
          </div>

          <div className="hero__floating-card">
            <span className="hero__card-badge">+ бесплатный аудит</span>
            <button
              className="hero__card-glass"
              type="button"
              onClick={() =>
                openModal({
                  theme: 'blue-grad',
                  num: '01',
                  name: 'Сайт под ключ',
                  desc: 'От простых лендингов до сложных экосистем с ИИ, интеграцией 1С и Битрикс24',
                })
              }
            >
              <span className="hero__card-thumb">
                <img
                  src="/assets/hero-preview-project.gif"
                  alt="Разработка сайта под ключ от 36 000 рублей — пример проекта студии Велкод"
                  title="Сайт под ключ от студии Велкод"
                  className="hero__card-img"
                  width={110}
                  height={80}
                  loading="lazy"
                />
              </span>
              <span className="hero__card-text">
                <span className="hero__card-label">Сайт под ключ</span>
                <strong className="hero__card-price">от 36 000 ₽</strong>
              </span>
              <span className="hero__card-arrow">
                <svg className="icon hero__card-icon" aria-hidden="true">
                  <use href="#icon-arrow" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
