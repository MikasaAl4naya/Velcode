'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { COMPANY_CONFIG } from '@/lib/company';
import { useCompanyContacts } from '@/components/CompanyContactsProvider';
import {
  CONSENT_HTML,
  COOKIES_HTML,
  PRIVACY_P0_HTML,
  PRIVACY_P3_HTML,
} from '@/lib/legalData';

function formatHtml(raw: string, contacts: { email: string; inn: string; ogrnip: string }): string {
  if (!raw) return '';
  const host = COMPANY_CONFIG.defaultSiteHost;
  return raw
    .replace(/velcode\.ru\/privacy/g, `${host}/privacy`)
    .replace(/velcode\.ru/g, host)
    .replace(/velcode@inbox\.ru/g, contacts.email)
    .replace(/381914585931/g, contacts.inn)
    .replace(/326385000117097/g, contacts.ogrnip);
}

type LegalPageContentProps = {
  type: 'privacy' | 'consent' | 'cookies';
};

export function LegalPageContent({ type }: LegalPageContentProps) {
  const contacts = useCompanyContacts();
  let title = '';
  let content: React.ReactNode = null;

  if (type === 'privacy') {
    title = 'Политика в отношении обработки персональных данных';
    content = (
      <>
        <div
          className="legal-page__body"
          dangerouslySetInnerHTML={{ __html: formatHtml(PRIVACY_P0_HTML, contacts) }}
        />

        <div className="legal-page__table-wrap">
          <table className="legal-page__table">
            <tbody>
              <tr>
                <td>Цель обработки</td>
                <td>Продвижение товаров, работ, услуг на рынке</td>
              </tr>
              <tr>
                <td>Персональные данные</td>
                <td>
                  • Фамилия, имя, отчество<br />
                  • Электронный адрес<br />
                  • Номера телефонов<br />
                  • Сведения, собираемые посредством метрических программ
                </td>
              </tr>
              <tr>
                <td>Правовые основания</td>
                <td>Согласие субъекта персональных данных</td>
              </tr>
              <tr>
                <td>Виды обработки персональных данных</td>
                <td>
                  Сбор, запись, систематизация, накопление, хранение, извлечение, использование, передача, блокирование, удаление, уничтожение
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          className="legal-page__body"
          dangerouslySetInnerHTML={{ __html: formatHtml(PRIVACY_P3_HTML, contacts) }}
        />
      </>
    );
  } else if (type === 'consent') {
    title = 'Согласие на обработку персональных данных';
    content = (
      <div
        className="legal-page__body"
        dangerouslySetInnerHTML={{ __html: formatHtml(CONSENT_HTML, contacts) }}
      />
    );
  } else if (type === 'cookies') {
    title = 'Согласие на использование файлов cookie';
    content = (
      <div
        className="legal-page__body"
        dangerouslySetInnerHTML={{ __html: formatHtml(COOKIES_HTML, contacts) }}
      />
    );
  }

  return (
    <div className="legal-page">
      <div className="legal-page__container">
        <Breadcrumbs
          items={[
            { label: 'Главная', href: '/' },
            { label: title, current: true },
          ]}
        />

        <h1 className="legal-page__title">{title}</h1>

        <div className="legal-page__content">{content}</div>
      </div>
    </div>
  );
}
