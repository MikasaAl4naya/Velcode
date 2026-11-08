'use client';

import { COMPANY_CONFIG } from '@/lib/company';
import { ymGoal } from '@/lib/ym';

type ContactChannelsProps = {
  className?: string;
  linkClassName?: string;
  source?: string;
  idPrefix?: string;
};

export function ContactChannels({
  className = '',
  linkClassName = '',
  source = 'contacts',
  idPrefix = 'contacts',
}: ContactChannelsProps) {
  return (
    <div className={className}>
      <a
        id={`${idPrefix}-phone`}
        href={`tel:${COMPANY_CONFIG.phoneLink}`}
        className={linkClassName}
        onClick={() => ymGoal(`${source}_click_phone`)}
      >
        {COMPANY_CONFIG.phone}
      </a>
      <a
        id={`${idPrefix}-email`}
        href={`mailto:${COMPANY_CONFIG.email}`}
        className={linkClassName}
        onClick={() => ymGoal(`${source}_click_email`)}
      >
        {COMPANY_CONFIG.email}
      </a>
    </div>
  );
}
