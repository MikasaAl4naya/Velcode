'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (error?.name === 'ChunkLoadError' || error?.message?.includes('Loading chunk')) {
      window.location.reload();
    }
    console.error('[global error]', error);
  }, [error]);

  return (
    <html lang="ru">
      <body
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          gap: '1rem',
          margin: 0,
        }}
      >
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
          Что-то пошло не так
        </h1>
        <p style={{ color: '#666', margin: 0, maxWidth: '30ch' }}>
          {process.env.NODE_ENV === 'development'
            ? error?.message || 'Неизвестная ошибка'
            : 'Попробуйте обновить страницу.'}
        </p>
        <button
          onClick={reset}
          style={{
            padding: '0.6rem 1.4rem',
            borderRadius: '8px',
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.95rem',
          }}
        >
          Обновить
        </button>
      </body>
    </html>
  );
}
