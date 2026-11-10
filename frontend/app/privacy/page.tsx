import type { Metadata } from 'next';
import { Header } from '@/components/sections/Header';
import { Footer } from '@/components/sections/Footer';
import { LegalPageContent } from '@/components/ui/LegalPageContent';

export const metadata: Metadata = {
  title: 'Политика обработки персональных данных — Велкод',
  robots: {
    index: false,
    follow: false,
  },
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
