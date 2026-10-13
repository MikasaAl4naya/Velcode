'use client';

import { useEffect } from 'react';

/**
 * Хук плавной инерционной прокрутки страницы для щелчкового колеса мыши.
 * Не влияет на тачпады, мобильные свайпы и режим prefers-reduced-motion.
 */
export function useSmoothWheel() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const SMOOTH_MS = 120;
    const LINE_PX = 40;

    let target = 0;
    let current = 0;
    let lastSetY = 0;
    let lastTime = 0;
    let frameId: number | null = null;

    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

    const isNotchWheel = (event: WheelEvent) =>
      event.deltaMode === 1 ||
      (event.deltaMode === 0 &&
        event.deltaX === 0 &&
        Math.abs(event.deltaY) >= 50 &&
        ((event as any).wheelDeltaY === undefined || (event as any).wheelDeltaY % 120 === 0));

    function stop() {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
    }
    (window as any).__stopSmoothWheel = stop;

    function step(now: number) {
      if (Math.abs(window.scrollY - lastSetY) > 2) return stop();

      const dt = Math.min(now - lastTime, 64);
      lastTime = now;
      current += (target - current) * (1 - Math.exp(-dt / SMOOTH_MS));
      if (Math.abs(target - current) < 0.5) current = target;

      window.scrollTo({ top: current, behavior: 'instant' });
      lastSetY = window.scrollY;
      frameId = current === target ? null : requestAnimationFrame(step);
    }

    const onWheel = (event: WheelEvent) => {
      const isMobile = window.matchMedia('(max-width: 767.98px)').matches;
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        isMobile ||
        document.body.classList.contains('is-scroll-locked')
      ) {
        return;
      }

      if (
        typeof (window as any).__handleServicesWheel === 'function' &&
        (window as any).__handleServicesWheel(event)
      ) {
        return;
      }

      if (!isNotchWheel(event)) return;

      event.preventDefault();
      if (frameId === null) current = target = lastSetY = window.scrollY;

      const delta = event.deltaMode === 1 ? event.deltaY * LINE_PX : event.deltaY;
      let nextTarget = Math.min(Math.max(target + delta, 0), maxScroll());

      if (typeof (window as any).__getServicesLockY === 'function') {
        const lockY = (window as any).__getServicesLockY();
        if (lockY !== null && delta > 0 && window.scrollY <= lockY + 2) {
          nextTarget = Math.min(nextTarget, lockY);
        }
      }

      target = nextTarget;

      if (frameId === null) {
        lastTime = performance.now();
        frameId = requestAnimationFrame(step);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', onWheel);
      stop();
      delete (window as any).__stopSmoothWheel;
    };
  }, []);
}
