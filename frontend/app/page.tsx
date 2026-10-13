import { Header } from '@/components/sections/Header';
import { Hero } from '@/components/sections/Hero';
import { Services } from '@/components/sections/Services';
import { Advantages } from '@/components/sections/Advantages';
import { Portfolio } from '@/components/sections/Portfolio';
import { Contacts } from '@/components/sections/Contacts';
import { Footer } from '@/components/sections/Footer';
import { SmoothWheelProvider } from '@/components/SmoothWheelProvider';

export default function Page() {
  return (
    <SmoothWheelProvider>
      <Header currentPath="/" />
      <main>
        <Hero />
        <Services />
        <Advantages />
        <Portfolio />
        <Contacts />
      </main>
      <Footer />
    </SmoothWheelProvider>
  );
}
