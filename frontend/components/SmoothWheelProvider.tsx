'use client';

import { useSmoothWheel } from '@/hooks/useSmoothWheel';

export function SmoothWheelProvider({ children }: { children: React.ReactNode }) {
  useSmoothWheel();
  return <>{children}</>;
}
