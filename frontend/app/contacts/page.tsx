import { Header } from '@/components/sections/Header';
import { Contacts } from '@/components/sections/Contacts';
import { Footer } from '@/components/sections/Footer';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata = {
  title: 'Контакты — Велкод',
  description: 'Свяжитесь со студией Велкод. Телефон, email, Telegram, MAX.',
};

export default function ContactsPage() {
  return (
    <>
      <Header currentPath="/contacts" />
      <main className="page__main">
        <div className="contacts-page">
          <div className="contacts-page__container">
            <Breadcrumbs
              items={[
                { label: 'Главная', href: '/' },
                { label: 'Контакты', current: true },
              ]}
            />
          </div>
          <Contacts isStandalone={true} />
        </div>
      </main>
      <Footer />
    </>
  );
}
