'use client';

import { ModalProvider as ModalContextProvider } from '@/hooks/useModal';
import { Modal } from '@/components/ui/Modal';
import { SuccessModal } from '@/components/ui/SuccessModal';

export function ModalProvider({ children }: { children: React.ReactNode }) {
  return (
    <ModalContextProvider>
      {children}
      <Modal />
      <SuccessModal />
    </ModalContextProvider>
  );
}
