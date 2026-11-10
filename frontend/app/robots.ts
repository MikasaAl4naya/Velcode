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
      ],
    },
    sitemap: 'https://velcode.ru/sitemap.xml',
  };
}
