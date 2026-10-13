'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ServiceData } from '@/lib/siteData';

type ModalService = ServiceData | null;

type ModalContextType = {
  isOpen: boolean;
  service: ModalService;
  isSuccessOpen: boolean;
  openModal: (service?: ModalService) => void;
  closeModal: () => void;
  openSuccessModal: () => void;
  closeSuccessModal: () => void;
};

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<{ isOpen: boolean; service: ModalService }>({
    isOpen: false,
    service: null,
  });

  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const openModal = useCallback((service: ModalService = null) => {
    setModalState({
      isOpen: true,
      service,
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
