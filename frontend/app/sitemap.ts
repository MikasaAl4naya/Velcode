import type { MetadataRoute } from 'next';
import { getPortfolio } from '@/lib/api';

const BASE_URL = 'https://velcode.ru';

// Фиксированная дата последнего релиза/обновления контента сайта,
// чтобы поисковые краулеры не получали новое значение на каждый HTTP-запрос.
const SITE_LAST_MODIFIED = new Date('2026-11-10T08:00:00.000Z');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: SITE_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/services`,
      lastModified: SITE_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/portfolio`,
      lastModified: SITE_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/advantages`,
      lastModified: SITE_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contacts`,
      lastModified: SITE_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  try {
    const cases = await getPortfolio();
    const dynamicRoutes: MetadataRoute.Sitemap = cases
      .filter((item) => Boolean(item.slug))
      .map((item) => ({
        url: `${BASE_URL}/portfolio/${item.slug}`,
        lastModified: SITE_LAST_MODIFIED,
        changeFrequency: 'monthly',
        priority: 0.7,
      }));

    return [...staticRoutes, ...dynamicRoutes];
  } catch {
    return staticRoutes;
  }
}
