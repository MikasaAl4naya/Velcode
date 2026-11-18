import React from 'react';

export interface CloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  variant?: 'modal' | 'badge' | 'screen' | 'chat' | 'inline';
  size?: number;
}

export function CloseButton({
  className = '',
  variant = 'modal',
  size,
  'aria-label': ariaLabel = 'Закрыть',
  type = 'button',
  ...props
}: CloseButtonProps) {
  let baseClass = 'modal__close';
  let iconSize = size ?? 24;

  if (variant === 'badge') {
    baseClass = 'modal__close modal__close--badge';
    iconSize = size ?? 24;
  } else if (variant === 'screen') {
    baseClass = 'modal__close modal__close--screen';
    iconSize = size ?? 24;
  } else if (variant === 'chat') {
    baseClass = 'ai-chat-header__btn ai-chat-header__btn--close';
    iconSize = size ?? 20;
  } else if (variant === 'inline') {
    baseClass = 'close-btn';
    iconSize = size ?? 24;
  }

  return (
    <button
      type={type}
      className={`${baseClass} ${className}`.trim()}
      aria-label={ariaLabel}
      {...props}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="close-btn__icon"
      >
        <path
          d="M19 5L5 19M5 5L19 19"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

