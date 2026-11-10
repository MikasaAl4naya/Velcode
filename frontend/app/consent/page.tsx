import type { Metadata } from 'next';
import { Header } from '@/components/sections/Header';
import { Footer } from '@/components/sections/Footer';
import { LegalPageContent } from '@/components/ui/LegalPageContent';

export const metadata: Metadata = {
  title: 'Согласие на обработку персональных данных — Велкод',
  robots: {
    index: false,
    follow: false,
  },
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
