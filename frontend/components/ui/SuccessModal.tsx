'use client';

import { useEffect, useRef, useState } from 'react';
import { useModal } from '@/hooks/useModal';

export function SuccessModal() {
  const { isSuccessOpen, closeSuccessModal } = useModal();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [renderOpen, setRenderOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isSuccessOpen) {
      if (!dialog.open) {
        dialog.showModal();
        document.body.classList.add('is-scroll-locked');
      }
      setIsClosing(false);
      requestAnimationFrame(() => {
        setRenderOpen(true);
      });
    } else if (dialog.open && !isClosing) {
      handleClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessOpen]);

  const handleClose = () => {
    if (isClosing) return;
    setRenderOpen(false);
    setIsClosing(true);

    const dialog = dialogRef.current;
    const timer = setTimeout(() => {
      if (dialog && dialog.open) {
        dialog.close();
      }
      document.body.classList.remove('is-scroll-locked');
      setIsClosing(false);
      closeSuccessModal();
    }, 300);

    return () => clearTimeout(timer);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const target = e.target as HTMLElement;
    if (target.dataset.modalClose !== undefined) {
      handleClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={`modal modal--notification ${renderOpen ? 'is-open' : ''} ${isClosing ? 'is-closing' : ''}`}
      id="successModal"
      aria-labelledby="successModalTitle"
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
    >
      <div className="modal__overlay" data-modal-close=""></div>

      <div className="modal__panel modal__panel--success" tabIndex={-1}>
        <h2 className="modal__success-title" id="successModalTitle">
          Ваша заявка отправлена!
        </h2>
        <p className="modal__success-desc">
          В ближайшее время мы с вами свяжемся
        </p>

        <button
          type="button"
          className="btn modal__success-btn"
          onClick={handleClose}
        >
          Хорошо
        </button>
      </div>
    </dialog>
  );
}
