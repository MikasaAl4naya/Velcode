import { Header } from '@/components/sections/Header';
import { Advantages } from '@/components/sections/Advantages';
import { Contacts } from '@/components/sections/Contacts';
import { Footer } from '@/components/sections/Footer';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata = {
  title: 'Преимущества — Велкод',
  description: 'Почему стоит выбрать студию Велкод для разработки сайта и автоматизации бизнеса.',
};

export default function AdvantagesPage() {
  return (
    <>
      <Header currentPath="/advantages" />
      <main className="page__main">
        <div className="advantages-page">
          <div className="advantages-page__container">
            <Breadcrumbs
              items={[
                { label: 'Главная', href: '/' },
                { label: 'Преимущества', current: true },
              ]}
            />
          </div>
          <Advantages isStandalone={true} />
        </div>
        <Contacts />
      </main>
      <Footer />
    </>
  );
}
