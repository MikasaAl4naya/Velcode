import { Header } from '@/components/sections/Header';
import { Footer } from '@/components/sections/Footer';
import { LegalPageContent } from '@/components/ui/LegalPageContent';

export const metadata = {
  title: 'Политика обработки персональных данных — Велкод',
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="page__main">
        <LegalPageContent type="privacy" />
      </main>
      <Footer />
    </>
  );
}
