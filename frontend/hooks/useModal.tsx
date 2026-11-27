'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ServiceData } from '@/lib/siteData';
import { ymGoal } from '@/lib/ym';

type ModalService = ServiceData | null;

export type ModalTriggerMeta = {
  section_id?: string;
  button_text?: string;
} | null;

type ModalContextType = {
  isOpen: boolean;
  service: ModalService;
  triggerMeta: ModalTriggerMeta;
  isSuccessOpen: boolean;
  openModal: (service?: ModalService) => void;
  closeModal: () => void;
  openSuccessModal: () => void;
  closeSuccessModal: () => void;
};

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    service: ModalService;
    triggerMeta: ModalTriggerMeta;
  }>({
    isOpen: false,
    service: null,
    triggerMeta: null,
  });

  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const openModal = useCallback((service: ModalService = null) => {
    ymGoal('open_service_modal');
    let triggerMeta: ModalTriggerMeta = null;
    if (typeof document !== 'undefined') {
      const el = document.activeElement as HTMLElement | null;
      if (el && el !== document.body) {
        const button_text = (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 100) || undefined;
        const section_id =
          el.closest('section[id], [id]')?.id ||
          el.closest('section')?.className?.split(' ')[0] ||
          undefined;
        triggerMeta = { section_id, button_text };
      }
    }
    setModalState({
      isOpen: true,
      service,
      triggerMeta,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const openSuccessModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    setIsSuccessOpen(true);
  }, []);

  const closeSuccessModal = useCallback(() => {
    setIsSuccessOpen(false);
  }, []);

  return (
    <ModalContext.Provider
      value={{
        ...modalState,
        isSuccessOpen,
        openModal,
        closeModal,
        openSuccessModal,
        closeSuccessModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextType {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return ctx;
}
