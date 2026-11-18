'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { COOKIE_STORAGE_KEY, COOKIE_CONSENT_EVENT } from '@/components/analytics/YandexMetrika';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!consent) {
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    setIsClosing(true);
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, 'accepted');
      window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
    } catch {
      // ignore
    }
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <aside
      className={`cookie-banner ${isClosing ? 'is-closing' : 'is-open'}`}
      role="region"
      aria-label="Использование файлов cookie"
    >
      <p className="cookie-banner__text">
        Находясь на сайте, вы даете согласие на использование файлов cookie в соответствии с{' '}
        <Link
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="cookie-banner__link"
        >
          Политикой
        </Link>
        .
      </p>

      <div className="cookie-banner__actions">
        <Link
          href="/cookies"
          className="btn cookie-banner__btn cookie-banner__btn--more"
        >
          Подробнее
        </Link>
        <button
          type="button"
          className="btn cookie-banner__btn cookie-banner__btn--accept"
          onClick={handleAccept}
        >
          Хорошо
        </button>
      </div>
    </aside>
  );
}
