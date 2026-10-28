'use client';

import { useModal } from '@/hooks/useModal';

export function CaseContactButton() {
  const { openModal } = useModal();
  
  return (
    <button 
      type="button" 
      className="btn btn--primary-lg" 
      onClick={() => openModal()}
    >
      <span>Хочу такой же проект</span>
    </button>
  );
}
