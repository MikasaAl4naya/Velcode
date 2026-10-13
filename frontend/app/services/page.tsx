import { Header } from '@/components/sections/Header';
import { Services } from '@/components/sections/Services';
import { Footer } from '@/components/sections/Footer';

export const metadata = {
  title: 'Услуги — Велкод',
  description: 'Разработка сайтов, реклама, интеграции с 1С и Битрикс24, создание ИИ-ассистентов. Велкод Иркутск.',
};

export default function ServicesPage() {
  return (
    <>
      <Header currentPath="/services" />
      <main>
        <Services isStandalone={true} />
      </main>
      <Footer />
    </>
  );
}
