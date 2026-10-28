'use client';

import { COMPANY_CONFIG } from '@/lib/company';
import { ymGoal } from '@/lib/ym';

type SocialLinksProps = {
  className?: string;
  itemClassName?: string;
};

export function SocialLinks({ className = '', itemClassName = '' }: SocialLinksProps) {
  return (
    <div className={className}>
      <a
        href={COMPANY_CONFIG.maxBot}
        target="_blank"
        rel="noopener noreferrer"
        className={itemClassName}
        aria-label="MAX чат-бот"
        title="Написать в MAX"
        onClick={() => ymGoal('click_max')}
      >
        <svg className="icon icon--max" aria-hidden="true">
          <use href="#icon-max" />
        </svg>
      </a>
      <a
        href={COMPANY_CONFIG.telegramBot}
        target="_blank"
        rel="noopener noreferrer"
        className={itemClassName}
        aria-label="Telegram"
        title="Написать в Telegram"
        onClick={() => ymGoal('click_telegram')}
      >
        <svg className="icon icon--telegram" aria-hidden="true">
          <use href="#icon-telegram" />
        </svg>
      </a>
    </div>
  );
}
