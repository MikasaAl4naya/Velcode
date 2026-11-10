import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/admin/',
        '/api/',
        '/privacy',
        '/consent',
        '/cookies',
        '/404',
      ],
    },
    sitemap: 'https://velcode.ru/sitemap.xml',
    host: 'https://velcode.ru',
  };
}
