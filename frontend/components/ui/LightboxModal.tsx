'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/CloseButton';

export interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  activeIndex: number;
  onNavigate: (index: number) => void;
  title?: string;
}

export function LightboxModal({
  isOpen,
  onClose,
  images,
  activeIndex,
  onNavigate,
  title = 'Изображение',
}: LightboxModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    document.body.classList.add('is-scroll-locked');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        if (activeIndex > 0) onNavigate(activeIndex - 1);
      } else if (e.key === 'ArrowRight') {
        if (activeIndex < images.length - 1) onNavigate(activeIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('is-scroll-locked');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, activeIndex, images, onClose, onNavigate]);

  if (!isOpen || images.length === 0 || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="screenshot-modal is-open"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр изображения"
      onClick={onClose}
    >
      <CloseButton
        variant="screen"
        onClick={onClose}
      />

      <button
        type="button"
        className="screenshot-modal__nav screenshot-modal__nav--prev"
        aria-label="Предыдущее изображение"
        disabled={activeIndex <= 0}
        onClick={(e) => {
          e.stopPropagation();
          if (activeIndex > 0) onNavigate(activeIndex - 1);
        }}
      >
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <path
            d="M12 4L6 10L12 16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <button
        type="button"
        className="screenshot-modal__nav screenshot-modal__nav--next"
        aria-label="Следующее изображение"
        disabled={activeIndex >= images.length - 1}
        onClick={(e) => {
          e.stopPropagation();
          if (activeIndex < images.length - 1) onNavigate(activeIndex + 1);
        }}
      >
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <path
            d="M8 4L14 10L8 16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        className="screenshot-modal__dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[activeIndex]}
          alt={`${title} — экран ${activeIndex + 1}`}
          className="screenshot-modal__img"
          draggable={false}
        />

        <div className="screenshot-modal__counter">
          {activeIndex + 1} / {images.length}
        </div>
      </div>
    </div>,
    document.body
  );
}
