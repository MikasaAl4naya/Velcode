'use client';

import Link from 'next/link';
import { COMPANY_CONFIG, getCurrentYear } from '@/lib/company';
import { useCompanyContacts } from '@/components/CompanyContactsProvider';

export function Footer() {
  const currentYear = getCurrentYear();
  const siteHost = COMPANY_CONFIG.defaultSiteHost;
  const contacts = useCompanyContacts();

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__col-left">
          <span className="footer__logo">{COMPANY_CONFIG.brandName}</span>
          <p className="footer__requisites">
            {contacts.companyName}<br />
            ИНН: {contacts.inn}<br />
            ОГРНИП: {contacts.ogrnip}
          </p>
        </div>

        <div className="footer__col-right">
          <p className="footer__copyright">
            {currentYear}© {siteHost}
          </p>
          <div className="footer__links">
            <Link href="/consent" className="footer__link">
              Согласие на обработку персональных данных
            </Link>
            <Link href="/cookies" className="footer__link">
              Согласие на использование файлов cookie
            </Link>
            <Link href="/privacy" className="footer__link">
              Политика в отношении обработки персональных данных
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
