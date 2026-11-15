'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { CompanyContact } from '@/lib/api';
import { COMPANY_CONFIG } from '@/lib/company';

export type ContactsContextValue = {
  companyName: string;
  inn: string;
  ogrnip: string;
  phone: string;
  phoneLink: string;
  email: string;
  telegramUrl: string;
  maxUrl: string;
};

const defaultContacts: ContactsContextValue = {
  companyName: COMPANY_CONFIG.ipFullName,
  inn: COMPANY_CONFIG.inn,
  ogrnip: COMPANY_CONFIG.ogrnip,
  phone: COMPANY_CONFIG.phone,
  phoneLink: COMPANY_CONFIG.phoneLink,
  email: COMPANY_CONFIG.email,
  telegramUrl: COMPANY_CONFIG.telegramBot,
  maxUrl: COMPANY_CONFIG.maxBot,
};

const ContactsContext = createContext<ContactsContextValue>(defaultContacts);

export function CompanyContactsProvider({
  initialContacts,
  children,
}: {
  initialContacts?: CompanyContact | null;
  children: React.ReactNode;
}) {
  const [contacts, setContacts] = useState<ContactsContextValue>(() => {
    if (initialContacts) {
      return {
        companyName: initialContacts.company_name || defaultContacts.companyName,
        inn: initialContacts.inn || defaultContacts.inn,
        ogrnip: initialContacts.ogrnip || defaultContacts.ogrnip,
        phone: initialContacts.phone || defaultContacts.phone,
        phoneLink: (initialContacts.phone || defaultContacts.phone).replace(/\D/g, ''),
        email: initialContacts.email || defaultContacts.email,
        telegramUrl: initialContacts.telegram_url || defaultContacts.telegramUrl,
        maxUrl: initialContacts.max_url || defaultContacts.maxUrl,
      };
    }
    return defaultContacts;
  });

  useEffect(() => {
    fetch('/api/contacts')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: CompanyContact | null) => {
        if (data) {
          setContacts({
            companyName: data.company_name,
            inn: data.inn,
            ogrnip: data.ogrnip,
            phone: data.phone,
            phoneLink: data.phone.replace(/\D/g, ''),
            email: data.email,
            telegramUrl: data.telegram_url,
            maxUrl: data.max_url,
          });
        }
      })
      .catch(() => {});
  }, []);

  return <ContactsContext.Provider value={contacts}>{children}</ContactsContext.Provider>;
}

export function useCompanyContacts(): ContactsContextValue {
  return useContext(ContactsContext);
}
