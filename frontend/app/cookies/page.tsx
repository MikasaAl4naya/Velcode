import { Header } from '@/components/sections/Header';
import { Footer } from '@/components/sections/Footer';
import { LegalPageContent } from '@/components/ui/LegalPageContent';

export const metadata = {
  title: 'Согласие на использование файлов cookie — Велкод',
};

export default function CookiesPage() {
  return (
    <>
      <Header />
      <main className="page__main">
        <LegalPageContent type="cookies" />
      </main>
      <Footer />
    </>
  );
}
