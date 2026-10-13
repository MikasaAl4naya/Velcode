'use client';

import Link from 'next/link';
import { useModal } from '@/hooks/useModal';
import { Header } from '@/components/sections/Header';
import { Footer } from '@/components/sections/Footer';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function CasePage() {
  const { openModal } = useModal();

  const handleConsultationClick = () => {
    openModal({
      num: '00',
      theme: 'dark',
      title: 'Хотите такой же сайт?',
      desc: 'Оставьте контакты, и мы свяжемся с вами в течение 15 минут для подробной консультации и расчета сметы.',
    });
  };

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

            <header className="case-page__header">
              <div className="case-page__title-wrap">
                <h1 className="case-page__title">
                  Разработка сайта для рестобара Trattoria Pomodoro
                </h1>
                <p className="case-page__lead">
                  Комплексное создание современного имиджевого веб-ресурса с интерактивным меню,
                  системой онлайн-бронирования столиков и бесшовной интеграцией в CRM-систему Битрикс24.
                </p>
              </div>

              <div className="case-page__tags">
                <span className="case-tag">Разработка сайта</span>
                <span className="case-tag">Веб-дизайн</span>
                <span className="case-tag">UX/UI проектирование</span>
                <span className="case-tag">Адаптивная верстка</span>
                <span className="case-tag">Интеграция CRM</span>
              </div>
            </header>

            <div className="case-page__specs">
              <div className="case-spec">
                <span className="case-spec__label">Клиент</span>
                <span className="case-spec__value">Trattoria Pomodoro</span>
              </div>
              <div className="case-spec">
                <span className="case-spec__label">Формат</span>
                <span className="case-spec__value">Сайт под ключ</span>
              </div>
              <div className="case-spec">
                <span className="case-spec__label">Срок работы</span>
                <span className="case-spec__value">14 рабочих дней</span>
              </div>
              <div className="case-spec">
                <span className="case-spec__label">Стек технологий</span>
                <span className="case-spec__value">React, Vite, Битрикс24</span>
              </div>
            </div>

            <div className="case-page__gallery">
              <div className="case-page__img-main">
                <img
                  src="/assets/portfolio-site-preview-1.png"
                  alt="Кейс разработки сайта Trattoria Pomodoro — главный экран"
                  title="Главная страница сайта Trattoria Pomodoro"
                  className="case-page__img"
                  loading="eager"
                />
              </div>

              <div className="case-page__img-grid">
                <div className="case-page__img-sub">
                  <img
                    src="/assets/portfolio-site-preview-2.png"
                    alt="Кейс интернет-магазина спортивных товаров от веб-студии Велкод"
                    title="Интерфейс каталога интернет-магазина"
                    className="case-page__img"
                    loading="lazy"
                  />
                </div>
                <div className="case-page__img-sub">
                  <img
                    src="/assets/portfolio-site-preview-3.png"
                    alt="Кейс интеграции CRM Битрикс24 и 1С:Предприятие студии Велкод"
                    title="Панель интеграции и управления данными"
                    className="case-page__img"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

            <section className="case-page__cta">
              <div className="case-page__cta-content">
                <h2 className="case-page__cta-title">Хотите такой же сайт?</h2>
                <p className="case-page__cta-desc">
                  Оставьте заявку, и наши специалисты бесплатно проведут аудит вашей текущей площадки,
                  подберут оптимальный стек решений и рассчитают ориентировочную смету проекта.
                </p>
              </div>

              <button
                type="button"
                className="btn btn--primary-lg case-page__cta-btn"
                onClick={handleConsultationClick}
              >
                Получить консультацию
              </button>
            </section>

            <div className="case-page__narrative">
              <div className="case-narrative-block">
                <h3 className="case-narrative-block__title">Что было сделано</h3>
                <p className="case-narrative-block__text">
                  Мы разработали цифровой продукт полного цикла: от детального исследования потребностей
                  гостей рестобара до финального развертывания на защищенном сервере и настройки аналитики.
                </p>
                <ul className="case-narrative-block__list">
                  <li className="case-narrative-block__item">
                    <span className="case-narrative-block__dot"></span>
                    <span>Проектирование интуитивной структуры и адаптивного мобильного интерфейса</span>
                  </li>
                  <li className="case-narrative-block__item">
                    <span className="case-narrative-block__dot"></span>
                    <span>Интерактивное онлайн-меню с удобной фильтрацией блюд по категориям</span>
                  </li>
                  <li className="case-narrative-block__item">
                    <span className="case-narrative-block__dot"></span>
                    <span>Умная форма бронирования с моментальными уведомлениями администратора</span>
                  </li>
                  <li className="case-narrative-block__item">
                    <span className="case-narrative-block__dot"></span>
                    <span>Двусторонняя интеграция с базой данных 1С и CRM-системой Битрикс24</span>
                  </li>
                </ul>
              </div>

              <div className="case-narrative-block">
                <h3 className="case-narrative-block__title">Результаты в цифрах</h3>
                <p className="case-narrative-block__text">
                  Благодаря оптимизации скорости загрузки и продуманному пользовательскому пути сайт показал
                  впечатляющие результаты с первых дней запуска:
                </p>
                <ul className="case-narrative-block__list">
                  <li className="case-narrative-block__item">
                    <span className="case-narrative-block__dot"></span>
                    <span><strong>+48%</strong> прирост прямых онлайн-бронирований столиков без звонков</span>
                  </li>
                  <li className="case-narrative-block__item">
                    <span className="case-narrative-block__dot"></span>
                    <span><strong>98 / 100</strong> баллов в тесте производительности Google PageSpeed</span>
                  </li>
                  <li className="case-narrative-block__item">
                    <span className="case-narrative-block__dot"></span>
                    <span><strong>до 1.2 сек</strong> сократилось время полной загрузки страницы на смартфонах</span>
                  </li>
                  <li className="case-narrative-block__item">
                    <span className="case-narrative-block__dot"></span>
                    <span><strong>100%</strong> автоматизация учета заявок исключила потерю клиентов в часы пик</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
