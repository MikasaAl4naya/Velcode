'use client';

import { useModal } from '@/hooks/useModal';
import { Header } from '@/components/sections/Header';
import { Contacts } from '@/components/sections/Contacts';
import { Footer } from '@/components/sections/Footer';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SplitText } from '@/components/ui/SplitText';
import { Tag } from '@/components/ui/Tag';
import { BrowserMockup } from '@/components/ui/BrowserMockup';

export default function CasePage() {
  const { openModal } = useModal();

  return (
    <>
      <Header currentPath="/portfolio" />
      <main>
        <div className="case-page">
          <div className="case-page__container">
            <Breadcrumbs
              items={[
                { label: 'Главная', href: '/' },
                { label: 'Портфолио', href: '/portfolio' },
                { label: 'Сайт-визитка для рестобара Trattoria Pomodoro', current: true },
              ]}
            />

            {/* H1 */}
            <h1 className="case-page__title">
              <SplitText text="Сайт-визитка для рестобара" />
            </h1>

            {/* Теги — сразу под заголовком */}
            <div className="case-page__tags">
              <Tag>Концепт</Tag>
              <Tag>Веб-дизайн</Tag>
            </div>

            {/* Лид-текст */}
            <p className="case-page__lead">
              Комплексный веб-сайт для рестобара «Trattoria». Главные задачи — передать уникальную атмосферу
              заведения в цифровой среде, упростить пользовательский путь «выбор меню → бронирование столика» и
              сократить потери от «быстрых» заявок-бронирований со звонка.
            </p>

            {/* Hero-изображение (ноутбук) */}
            <div className="case-page__hero-wrap">
              <img
                src="/assets/case-trattoria-hero.png"
                alt="Кейс разработки сайта Trattoria Pomodoro — макет на ноутбуке"
                title="Сайт Trattoria Pomodoro — студия Велкод"
                className="case-page__hero-img"
                loading="eager"
              />
            </div>

            {/* «Что было сделано» — 2 колонки */}
            <div className="case-page__what">
              <h2 className="case-page__what-title">Что было сделано</h2>
              <div className="case-page__what-body">
                <p className="case-page__what-text">
                  Мы разработали атмосферный визуальный стиль с акцентом на тёплую атмосферу, продуманную типографику, занялись съёмкой с атмосферными фотографиями, создали дружелюбную онлайн-систему меню с удобной интерактивностью, а также реализовали систему «умного» онлайн-бронирования.
                </p>
                <p className="case-page__what-text">
                  В результате работы рестобар «Trattoria» получил не просто красивую визитку, а рабочий инструмент продаж.
                </p>
              </div>
            </div>

            {/* Браузерный мокап с скриншотом сайта */}
            <div className="case-page__mockup-wrap">
              <BrowserMockup url="trattoria.ru/">
                <img
                  src="/assets/portfolio-site-preview-2.png"
                  alt="Кейс Trattoria Pomodoro — интерфейс сайта в браузере"
                  title="Интерфейс сайта Trattoria Pomodoro"
                  loading="lazy"
                />
              </BrowserMockup>
            </div>
          </div>
        </div>
        <Contacts />
      </main>
      <Footer />
    </>
  );
}
