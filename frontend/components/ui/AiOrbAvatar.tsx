'use client';

import React, { useEffect, useRef, useCallback } from 'react';

export interface AiOrbAvatarProps {
  /** Диаметр сферы в пикселях (по умолчанию 76px) */
  size?: number;
  /** Включено ли интерактивное слежение за курсором мыши */
  interactive?: boolean;
  /** Включать ли анимацию смущения (^ ^ и румянец) при клике */
  enableShyOnClick?: boolean;
  /** Область отслеживания курсора: 'window' (весь экран) или 'chat' (только внутри окна чата) */
  trackScope?: 'window' | 'chat';
  /** Индикатор набора текста / размышления */
  isTyping?: boolean;
  /** Дополнительные CSS-классы */
  className?: string;
  /** Обработчик клика */
  onClick?: () => void;
}

export function AiOrbAvatar({
  size = 76,
  interactive = true,
  enableShyOnClick = false,
  trackScope = 'window',
  isTyping = false,
  className = '',
  onClick,
}: AiOrbAvatarProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const eyesRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);

  // Ссылки на координаты анимации (без лишних ре-рендеров React)
  const animStateRef = useRef({
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    idleOffsetX: 0,
    idleOffsetY: 0,
    lastMouseMoveTime: 0,
  });

  const isShyRef = useRef(false);
  const shyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerBlink = useCallback(() => {
    if (isShyRef.current) return;
    if (eyesRef.current) {
      eyesRef.current.classList.add('is-blinking');
      setTimeout(() => {
        eyesRef.current?.classList.remove('is-blinking');
      }, 130);
    }
  }, []);

  const triggerShy = useCallback(() => {
    const eyes = eyesRef.current;
    const widget = widgetRef.current;
    if (!eyes || !widget) return;

    // Включаем смущение и останавливаем движение взгляда за мышкой
    isShyRef.current = true;
    animStateRef.current.targetX = 0;
    animStateRef.current.targetY = 0;
    animStateRef.current.currentX = 0;
    animStateRef.current.currentY = 0;

    eyes.classList.remove('is-blinking');
    eyes.classList.add('is-shy');

    widget.classList.remove('is-shy');
    void widget.offsetWidth; // перезапуск CSS-анимации покачивания
    widget.classList.add('is-shy');

    if (shyTimerRef.current) {
      clearTimeout(shyTimerRef.current);
    }

    shyTimerRef.current = setTimeout(() => {
      isShyRef.current = false;
      eyes.classList.remove('is-shy');
      widget.classList.remove('is-shy');
    }, 650);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (enableShyOnClick) {
      triggerShy();
    } else {
      triggerBlink();
    }
    onClick?.();
  };

  useEffect(() => {
    const widget = widgetRef.current;
    const eyes = eyesRef.current;
    const core = coreRef.current;
    if (!widget || !eyes || !core) return;

    let animFrameId: number;
    let saccadeTimeoutId: NodeJS.Timeout;
    let blinkTimeoutId: NodeJS.Timeout;
    let isDestroyed = false;

    // Масштабирование смещений пропорционально размеру сферы
    const scale = size / 76;
    const maxEyeOffset = 11 * scale;
    const maxIdleOffset = 4.5 * scale;
    const idleTimeout = 1800;

    const handleMouseMove = (e: MouseEvent) => {
      // Пока персонаж щурится — слежение за курсором полностью заблокировано
      if (!interactive || isShyRef.current) return;
      animStateRef.current.lastMouseMoveTime = performance.now();

      const rect = widget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const angle = Math.atan2(deltaY, deltaX);

      const distance = Math.min(Math.hypot(deltaX, deltaY) / 160, 1);

      animStateRef.current.targetX = Math.cos(angle) * maxEyeOffset * distance;
      animStateRef.current.targetY = Math.sin(angle) * maxEyeOffset * distance;
    };

    const handleMouseLeave = () => {
      animStateRef.current.lastMouseMoveTime = 0;
      animStateRef.current.targetX = 0;
      animStateRef.current.targetY = 0;
    };

    // Определяем область отслеживания: весь экран (для лаунчера) или контейнер чата
    let trackTargetEl: HTMLElement | Window = window;
    if (trackScope === 'chat') {
      const chatContainer = (widget.closest('.ai-chat-window') || widget.closest('.ai-chat-body') || widget.parentElement) as HTMLElement | null;
      if (chatContainer) {
        trackTargetEl = chatContainer;
      }
    }

    trackTargetEl.addEventListener('mousemove', handleMouseMove as EventListener, { passive: true });
    if (trackTargetEl === window) {
      document.addEventListener('mouseleave', handleMouseLeave);
    } else {
      trackTargetEl.addEventListener('mouseleave', handleMouseLeave as EventListener);
    }

    // Генератор легких хаотичных движений глаз в покое
    const scheduleIdleSaccade = () => {
      if (isDestroyed) return;
      const nextMoveDelay = 700 + Math.random() * 1600;
      saccadeTimeoutId = setTimeout(() => {
        if (isDestroyed) return;
        if (isShyRef.current) {
          scheduleIdleSaccade();
          return;
        }
        if (Math.random() < 0.3) {
          animStateRef.current.idleOffsetX = (Math.random() - 0.5) * 1.5 * scale;
          animStateRef.current.idleOffsetY = (Math.random() - 0.5) * 1.5 * scale;
        } else {
          const randomAngle = Math.random() * Math.PI * 2;
          const randomRadius = (0.35 + Math.random() * 0.65) * maxIdleOffset;
          animStateRef.current.idleOffsetX = Math.cos(randomAngle) * randomRadius;
          animStateRef.current.idleOffsetY = Math.sin(randomAngle) * randomRadius * 0.8;
        }
        scheduleIdleSaccade();
      }, nextMoveDelay);
    };
    scheduleIdleSaccade();

    // Цикл моргания (с вероятностью двойного моргания)
    const scheduleNextBlink = () => {
      if (isDestroyed) return;
      const nextDelay = 2500 + Math.random() * 3000;
      blinkTimeoutId = setTimeout(() => {
        if (isDestroyed) return;
        triggerBlink();
        if (Math.random() > 0.65) {
          setTimeout(() => {
            if (!isDestroyed) triggerBlink();
          }, 220);
        }
        scheduleNextBlink();
      }, nextDelay);
    };
    scheduleNextBlink();

    // Плавный цикл анимации (60fps)
    const animateEyes = (now: number) => {
      if (isDestroyed) return;

      // Пока персонаж щурится / смущен — глаза строго зафиксированы по центру без смещения
      if (isShyRef.current) {
        eyes.style.transform = 'translate3d(0, 0, 0)';
        core.style.transform = 'translate3d(0, 0, 0)';
        animFrameId = requestAnimationFrame(animateEyes);
        return;
      }

      const state = animStateRef.current;
      const isIdle = !interactive || (now - state.lastMouseMoveTime > idleTimeout);

      const microDriftX = (Math.sin(now * 0.0023) * 1.1 + Math.cos(now * 0.0051) * 0.6) * scale;
      const microDriftY = (Math.cos(now * 0.0019) * 1.0 + Math.sin(now * 0.0043) * 0.5) * scale;

      const desiredX = isIdle ? (state.idleOffsetX + microDriftX) : (state.targetX + microDriftX * 0.35);
      const desiredY = isIdle ? (state.idleOffsetY + microDriftY) : (state.targetY + microDriftY * 0.35);

      const smoothing = isIdle ? 0.07 : 0.14;
      state.currentX += (desiredX - state.currentX) * smoothing;
      state.currentY += (desiredY - state.currentY) * smoothing;

      const rotateY = state.currentX * 1.8;
      const rotateX = -state.currentY * 1.8;

      eyes.style.transform = `translate3d(${state.currentX.toFixed(2)}px, ${state.currentY.toFixed(2)}px, 0) rotateX(${rotateX.toFixed(1)}deg) rotateY(${rotateY.toFixed(1)}deg)`;
      core.style.transform = `translate3d(${(state.currentX * 0.18).toFixed(2)}px, ${(state.currentY * 0.18).toFixed(2)}px, 0)`;

      animFrameId = requestAnimationFrame(animateEyes);
    };

    animFrameId = requestAnimationFrame(animateEyes);

    return () => {
      isDestroyed = true;
      trackTargetEl.removeEventListener('mousemove', handleMouseMove as EventListener);
      if (trackTargetEl === window) {
        document.removeEventListener('mouseleave', handleMouseLeave);
      } else {
        trackTargetEl.removeEventListener('mouseleave', handleMouseLeave as EventListener);
      }
      cancelAnimationFrame(animFrameId);
      clearTimeout(saccadeTimeoutId);
      clearTimeout(blinkTimeoutId);
      if (shyTimerRef.current) clearTimeout(shyTimerRef.current);
    };
  }, [interactive, trackScope, size, triggerBlink]);

  return (
    <div
      ref={widgetRef}
      className={`velcode-ai-widget ${className}`}
      style={{ '--orb-size': `${size}px` } as React.CSSProperties}
      onMouseEnter={triggerBlink}
      onClick={handleClick}
      aria-hidden="true"
    >
      {/* Внешнее мягкое свечение */}
      <div className="v-orb-ambient" />

      {/* Анимированные размытые кольца и волны */}
      <div className="v-orb-waves">
        <div className="v-wave v-wave-1" />
        <div className="v-wave v-wave-2" />
        <div className="v-wave v-wave-3" />
      </div>

      {/* Полупрозрачное ядро сферы */}
      <div ref={coreRef} className="v-orb-core">
        {/* Внутренние переливы */}
        <div className="v-inner-ribbon v-ribbon-1" />
        <div className="v-inner-ribbon v-ribbon-2" />

        {/* Глазки и щечки */}
        <div ref={eyesRef} className="v-eyes-wrapper">
          <span className="v-cheek v-cheek-left" />
          <span className="v-eye v-eye-left" />
          <span className="v-eye v-eye-right" />
          <span className="v-cheek v-cheek-right" />
        </div>
      </div>
    </div>
  );
}
