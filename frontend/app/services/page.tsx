import type { Metadata } from 'next';
import { Header } from '@/components/sections/Header';
import { Services } from '@/components/sections/Services';
import { Contacts } from '@/components/sections/Contacts';
import { Footer } from '@/components/sections/Footer';
import { fetchServices } from '@/lib/fetchServices';

export const metadata: Metadata = {
  title: 'Услуги — Велкод',
  description: 'Разработка сайтов, реклама, интеграции с 1С и Битрикс24, создание ИИ-ассистентов. Велкод Иркутск.',
  alternates: {
    canonical: '/services',
  },
};

export const revalidate = 3600;

export default async function ServicesPage() {
  const servicesItems = await fetchServices();

  const servicesSchema = {
    '@context': 'https://schema.org',
    '@graph': servicesItems.map((service, index) => {
      const numericPrice = service.price
        ? parseInt(service.price.replace(/[^\d]/g, ''), 10)
        : undefined;
      const serviceName = (service.name || service.title || '').replace(/\n/g, ' ');

      return {
        '@type': 'Service',
        '@id': `https://velcode.ru/services#service-${service.num || index + 1}`,
        name: serviceName,
        description: service.desc || `Услуга ${serviceName} от IT-студии Велкод`,
        provider: {
          '@id': 'https://velcode.ru/#organization',
        },
        areaServed: {
          '@type': 'AdministrativeArea',
          name: 'Россия',
        },
        ...(numericPrice
          ? {
              offers: {
                '@type': 'Offer',
                price: numericPrice,
                priceCurrency: 'RUB',
                priceSpecification: {
                  '@type': 'PriceSpecification',
                  price: numericPrice,
                  priceCurrency: 'RUB',
                  unitText: service.unit || 'за проект',
                },
                availability: 'https://schema.org/InStock',
                url: 'https://velcode.ru/services',
              },
            }
          : {}),
      };
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
      />
      <Header currentPath="/services" />
      <main className="page__main">
        <Services isStandalone={true} items={servicesItems} />
        <Contacts />
      </main>
      <Footer />
    </>
  );
}
