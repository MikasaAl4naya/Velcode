/**
 * Централизованная конфигурация и реквизиты компании.
 */

export const COMPANY_CONFIG = {
  brandName: 'велкод',
  ipFullName: 'ИП Манилат Виктория Пхетудоновна',
  ipShortName: 'ИП Манилат В. П.',
  inn: '381914585931',
  ogrnip: '326385000117097',
  legalAddress: '664019, Иркутская область, г. Иркутск, ул. Баррикад, д. 60/6, кв./офис 23',
  city: 'г. Иркутск',
  email: 'velcode@inbox.ru',
  phone: '+7 (924) 534 51 82',
  phoneLink: '+79245345182',
  telegramBot: 'https://t.me/VelcodeIRK',
  maxBot: 'https://max.ru/u/f9LHodD0cOIXsNCHlykOi9hpG3Q_0_ZRaXPmYzt9Yz_UgBRgZXjmEQBJXWg',
  defaultSiteHost: 'velcode.ru',
};

/**
 * Возвращает хост текущего сайта (например velcode.ru или localhost:3000)
 */
export function getSiteHost(): string {
  if (typeof window !== 'undefined' && window.location.host) {
    return window.location.host;
  }
  return COMPANY_CONFIG.defaultSiteHost;
}

/**
 * Возвращает полный origin (например https://velcode.ru или http://localhost:3000)
 */
export function getSiteOrigin(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return `https://${COMPANY_CONFIG.defaultSiteHost}`;
}

/**
 * Возвращает текущий год для подвала и документов
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}
