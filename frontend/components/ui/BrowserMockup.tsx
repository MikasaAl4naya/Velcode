'use client';

/**
 * Переиспользуемый макет браузерного окна macOS/Safari.
 * Отображает статичную панель с кнопками и адресной строкой,
 * под которой рендерится переданный контент (обычно скриншот сайта).
 */
export function BrowserMockup({
  url = 'trattoria.ru/',
  children,
  className = '',
}: {
  url?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`browser-mockup ${className}`.trim()}>
      {/* Шапка браузера */}
      <div className="browser-mockup__bar">
        <div className="browser-mockup__bar-side">
          <span className="browser-mockup__dots">
            <span className="browser-mockup__dot browser-mockup__dot--close" />
            <span className="browser-mockup__dot browser-mockup__dot--minimize" />
            <span className="browser-mockup__dot browser-mockup__dot--zoom" />
          </span>
          <svg className="browser-mockup__icon browser-mockup__icon--hide-sm" viewBox="0 0 16 16" aria-hidden="true">
            <rect x="1.5" y="3" width="13" height="10" rx="2" />
            <path d="M6 3v10" />
          </svg>
          <svg className="browser-mockup__icon browser-mockup__icon--hide-sm" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M10 3.5 5.5 8l4.5 4.5" />
          </svg>
          <svg className="browser-mockup__icon browser-mockup__icon--muted browser-mockup__icon--hide-sm" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M6 3.5 10.5 8 6 12.5" />
          </svg>
        </div>

        <div className="browser-mockup__bar-center">
          <svg className="browser-mockup__icon browser-mockup__icon--hide-sm" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 1.8 13 3.6v4c0 3.1-2.1 5.4-5 6.6-2.9-1.2-5-3.5-5-6.6v-4z" />
            <path d="M8 1.8v12.4" />
          </svg>
          <div className="browser-mockup__address">
            <svg className="browser-mockup__lock" viewBox="0 0 16 16" aria-hidden="true">
              <rect x="3.5" y="7" width="9" height="7" rx="1.5" />
              <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
            </svg>
            <span className="browser-mockup__url">{url}</span>
            <svg className="browser-mockup__reload" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M12.5 8a4.5 4.5 0 1 1-1.3-3.2" />
              <path d="M12 2.5v2.8H9.2" />
            </svg>
          </div>
        </div>

        <div className="browser-mockup__bar-side browser-mockup__bar-side--end">
          <svg className="browser-mockup__icon" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 1.5v8M5.2 4.3 8 1.5l2.8 2.8" />
            <path d="M5 6.5H3.5v8h9v-8H11" />
          </svg>
          <svg className="browser-mockup__icon" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 3v10M3 8h10" />
          </svg>
          <svg className="browser-mockup__icon" viewBox="0 0 16 16" aria-hidden="true">
            <rect x="2" y="5" width="9" height="9" rx="1.5" />
            <path d="M5 2.5h7a1.5 1.5 0 0 1 1.5 1.5v7" />
          </svg>
        </div>
      </div>

      {/* Контент (скриншот) */}
      <div className="browser-mockup__content">
        {children}
      </div>
    </div>
  );
}

export default BrowserMockup;
