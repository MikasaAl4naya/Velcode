import { Header } from '@/components/sections/Header';
import { Hero } from '@/components/sections/Hero';
import { Services } from '@/components/sections/Services';
import { Advantages } from '@/components/sections/Advantages';
import { Portfolio, PortfolioItem } from '@/components/sections/Portfolio';
import { Contacts } from '@/components/sections/Contacts';
import { Footer } from '@/components/sections/Footer';
import { SmoothWheelProvider } from '@/components/SmoothWheelProvider';
import { fetchServices } from '@/lib/fetchServices';

const API_BASE =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:8000';

async function fetchPortfolioItems(): Promise<PortfolioItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/portfolio?main=true`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data
      .filter((item: { slug?: string }) => item.slug)
      .map((item: { title: string; image_url?: string; site_url?: string; slug: string }) => ({
        title: item.title,
        img: item.image_url || '/assets/case-placeholder.png',
        url: item.site_url || 'velcode.ru/',
        link: `/portfolio/${item.slug}`,
      }));
  } catch {
    return [];
  }
}


export default async function Page() {
  const [portfolioItems, servicesItems] = await Promise.all([
    fetchPortfolioItems(),
    fetchServices(),
  ]);

  return (
    <SmoothWheelProvider>
      <Header currentPath="/" />
      <main className="page__main">
        <Hero />
        <Services items={servicesItems} />
        <Advantages />
        <Portfolio items={portfolioItems} />
        <Contacts />
      </main>
      <Footer />
    </SmoothWheelProvider>
  );
}
