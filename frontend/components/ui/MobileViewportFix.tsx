'use client';

import { useEffect } from 'react';

/**
 * Предотвращает рывки и зависание смещения экрана на мобильных устройствах
 * (iOS Safari, Android Chrome, Yandex Browser, Telegram Webview)
 * при появлении и скрытии виртуальной клавиатуры.
 */
export function MobileViewportFix() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let initialScrollY = 0;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
      ) {
        initialScrollY = window.scrollY;
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
      ) {
        // Даём клавиатуре завершить анимацию скрытия
        setTimeout(() => {
          const active = document.activeElement;
          const stillInForm =
            active &&
            (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT');

          if (!stillInForm) {
            // Принудительно синхронизируем visualViewport и layoutViewport во всех мобильных браузерах
            window.scrollTo({
              top: window.scrollY,
              left: 0,
              behavior: 'smooth',
            });

            // Для модального окна dialog проверяем корректность скролла
            const openModal = document.querySelector<HTMLDialogElement>('.modal[open]');
            if (openModal) {
              openModal.scrollTo({
                top: Math.max(0, openModal.scrollTop),
                behavior: 'smooth',
              });
            }
          }
        }, 120);
      }
    };

    document.addEventListener('focusin', handleFocusIn, { passive: true });
    document.addEventListener('focusout', handleFocusOut, { passive: true });

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return null;
}
