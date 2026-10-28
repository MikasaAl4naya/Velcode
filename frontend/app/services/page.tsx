import { Header } from '@/components/sections/Header';
import { Services } from '@/components/sections/Services';
import { Contacts } from '@/components/sections/Contacts';
import { Footer } from '@/components/sections/Footer';
import { fetchServices } from '@/lib/fetchServices';

export const metadata = {
  title: 'Услуги — Велкод',
  description: 'Разработка сайтов, реклама, интеграции с 1С и Битрикс24, создание ИИ-ассистентов. Велкод Иркутск.',
};

export default async function ServicesPage() {
  const servicesItems = await fetchServices();
  return (
    <>
      <Header currentPath="/services" />
      <main className="page__main">
        <Services isStandalone={true} items={servicesItems} />
        <Contacts />
      </main>
      <Footer />
    </>
  );
}
