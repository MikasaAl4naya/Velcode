'use client';

import { useCompanyContacts } from '@/components/CompanyContactsProvider';
import { ymGoal } from '@/lib/ym';

type SocialLinksProps = {
  className?: string;
  itemClassName?: string;
  source?: string;
  idPrefix?: string;
};

export function SocialLinks({
  className = '',
  itemClassName = '',
  source = 'contacts',
  idPrefix = 'contacts',
}: SocialLinksProps) {
  const contacts = useCompanyContacts();

  return (
    <div className={className}>
      <a
        id={`${idPrefix}-max`}
        href={contacts.maxUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={itemClassName}
        aria-label="MAX"
        title="Написать в MAX"
        onClick={() => ymGoal(`${source}_click_max`)}
      >
        <svg className="icon icon--max" aria-hidden="true">
          <use href="#icon-max" />
        </svg>
      </a>
      <a
        id={`${idPrefix}-telegram`}
        href={contacts.telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={itemClassName}
        aria-label="Telegram"
        title="Написать в Telegram"
        onClick={() => ymGoal(`${source}_click_telegram`)}
      >
        <svg className="icon icon--telegram" aria-hidden="true">
          <use href="#icon-telegram" />
        </svg>
      </a>
    </div>
  );
}
