import type { Metadata } from 'next';
import { Header } from '@/components/sections/Header';
import { Faq } from '@/components/sections/Faq';
import { Contacts } from '@/components/sections/Contacts';
import { Footer } from '@/components/sections/Footer';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { fetchFaq } from '@/lib/fetchFaq';

export const metadata: Metadata = {
  title: 'FAQ — Часто задаваемые вопросы | Велкод',
  description: 'Ответы на популярные вопросы о разработке сайтов, интеграции 1С и Битрикс24, стоимости, сроках и гарантиях студии Велкод.',
  alternates: {
    canonical: '/faq',
  },
};

export default async function FaqPage() {
  const faqItems = await fetchFaq();

  return (
    <>
      <Header currentPath="/faq" />
      <main className="page__main">
        <div className="faq-page">
          <div className="faq-page__container">
            <Breadcrumbs
              items={[
                { label: 'Главная', href: '/' },
                { label: 'FAQ', current: true },
              ]}
            />
          </div>
          <Faq isStandalone={true} items={faqItems} />
        </div>
        <Contacts />
      </main>
      <Footer />
    </>
  );
}
