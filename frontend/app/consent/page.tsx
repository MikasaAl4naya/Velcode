import { Header } from '@/components/sections/Header';
import { Footer } from '@/components/sections/Footer';
import { LegalPageContent } from '@/components/ui/LegalPageContent';

export const metadata = {
  title: 'Согласие на обработку персональных данных — Велкод',
};

export default function ConsentPage() {
  return (
    <>
      <Header />
      <main className="page__main">
        <LegalPageContent type="consent" />
      </main>
      <Footer />
    </>
  );
}
