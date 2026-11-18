import React from 'react';

export interface SliderArrowProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  direction: 'prev' | 'next';
  className?: string;
}

export function SliderArrow({
  direction,
  className = '',
  disabled,
  onClick,
  'aria-label': ariaLabel,
  ...props
}: SliderArrowProps) {
  const isPrev = direction === 'prev';
  const label = ariaLabel || (isPrev ? 'Назад' : 'Вперёд');

  return (
    <button
      type="button"
      className={`services__control-btn ${className}`.trim()}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        {isPrev ? (
          <path
            d="M12 4L6 10L12 16"
            stroke="#171819"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M8 4L14 10L8 16"
            stroke="#171819"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}

