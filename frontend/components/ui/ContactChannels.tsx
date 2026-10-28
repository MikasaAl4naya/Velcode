'use client';

import { COMPANY_CONFIG } from '@/lib/company';
import { ymGoal } from '@/lib/ym';

type ContactChannelsProps = {
  className?: string;
  linkClassName?: string;
};

export function ContactChannels({ className = '', linkClassName = '' }: ContactChannelsProps) {
  return (
    <div className={className}>
      <a
        href={`tel:${COMPANY_CONFIG.phoneLink}`}
        className={linkClassName}
        onClick={() => ymGoal('click_phone')}
      >
        {COMPANY_CONFIG.phone}
      </a>
      <a
        href={`mailto:${COMPANY_CONFIG.email}`}
        className={linkClassName}
        onClick={() => ymGoal('click_email')}
      >
        {COMPANY_CONFIG.email}
      </a>
    </div>
  );
}
