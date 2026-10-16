'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // ChunkLoadError = a JS chunk failed to download; reloading usually fixes it
    if (error?.name === 'ChunkLoadError' || error?.message?.includes('Loading chunk')) {
      window.location.reload();
    }
    console.error('[page error]', error);
  }, [error]);

  return (
    <div
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
    </div>
  );
}
