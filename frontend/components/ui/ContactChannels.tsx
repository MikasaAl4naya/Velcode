'use client';

import { useCompanyContacts } from '@/components/CompanyContactsProvider';
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
  const contacts = useCompanyContacts();

  return (
    <div className={className}>
      <a
        id={`${idPrefix}-phone`}
        href={`tel:+${contacts.phoneLink}`}
        className={linkClassName}
        onClick={() => ymGoal(`${source}_click_phone`)}
      >
        {contacts.phone}
      </a>
      <a
        id={`${idPrefix}-email`}
        href={`mailto:${contacts.email}`}
        className={linkClassName}
        onClick={() => ymGoal(`${source}_click_email`)}
      >
        {contacts.email}
      </a>
    </div>
  );
}
