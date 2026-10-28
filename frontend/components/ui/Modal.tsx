'use client';

import { useEffect, useRef, useState } from 'react';
import { useModal } from '@/hooks/useModal';
import { LeadForm } from './LeadForm';

export function Modal() {
  const { isOpen, service, closeModal } = useModal();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [renderOpen, setRenderOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
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
  }, [isOpen]);

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
      closeModal();
    }, 350);

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

  const hasService = Boolean(service);

  return (
    <dialog
      ref={dialogRef}
      className={`modal ${renderOpen ? 'is-open' : ''} ${isClosing ? 'is-closing' : ''}`}
      id="leadModal"
      aria-labelledby="leadModalTitle"
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
    >
      <div className="modal__overlay" data-modal-close=""></div>

      <div
        className={`modal__panel ${hasService ? 'modal__panel--has-service' : ''}`}
        tabIndex={-1}
      >
        <button
          className={`modal__close ${hasService ? 'modal__close--panel-service' : ''}`}
          type="button"
          onClick={handleClose}
          aria-label="Закрыть"
        ></button>

        {hasService && service && (
          <div
            className={`modal__service-badge modal__service-badge--${service.badgeTheme || service.theme || 'dark'}${service.decor ? ' modal__service-badge--decor' : ''}`}
            id="modalServiceBadge"
          >
            <button
              className="modal__close modal__close--badge"
              type="button"
              onClick={handleClose}
              aria-label="Закрыть"
            ></button>
            <div className="modal__service-badge-head">
              <span className="modal__service-badge-num">{service.num || '00'}</span>
              <h3
                className="modal__service-badge-title"
                dangerouslySetInnerHTML={{
                  __html: (service.badgeTitle || service.name || service.title || '').replace(/\n/g, '<br />'),
                }}
              />
            </div>
            <p className="modal__service-badge-desc">
              {service.badgeDesc || service.desc || ''}
            </p>
          </div>
        )}

        <div className="modal__content">
          <div className="modal__head">
            <h2 className="modal__title" id="leadModalTitle">
              Оставьте заявку
            </h2>
            <p className="modal__subtitle">Мы обязательно свяжемся с вами</p>
          </div>

          <LeadForm
            id="leadForm"
            theme="light"
            submitLabel="Отправить"
            submitButtonClass="btn--modal"
            source={service ? (service.name || service.title || 'service') : 'contact_form'}
          />
        </div>
      </div>
    </dialog>
  );
}
