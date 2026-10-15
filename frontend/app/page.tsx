import { Header } from '@/components/sections/Header';
import { Hero } from '@/components/sections/Hero';
import { Services } from '@/components/sections/Services';
import { Advantages } from '@/components/sections/Advantages';
import { Portfolio, PortfolioItem } from '@/components/sections/Portfolio';
import { Contacts } from '@/components/sections/Contacts';
import { Footer } from '@/components/sections/Footer';
import { SmoothWheelProvider } from '@/components/SmoothWheelProvider';
import type { ServiceData } from '@/lib/siteData';
import { SERVICES_DATA } from '@/lib/siteData';

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

async function fetchServices(): Promise<ServiceData[]> {
  try {
    const res = await fetch(`${API_BASE}/api/services`, { cache: 'no-store' });
    if (!res.ok) return SERVICES_DATA;
    const data: Array<{
      id: number;
      title: string;
      description: string;
      price_full: number;
      unit: string;
      is_featured: boolean;
      sort_order: number;
    }> = await res.json();
    if (!data.length) return SERVICES_DATA;
    return data.map((item, idx) => ({
      num: String(idx + 1).padStart(2, '0'),
      name: item.title,
      desc: item.description,
      price: `от ${item.price_full.toLocaleString('ru-RU')} ₽`,
      unit: item.unit,
      theme: item.is_featured ? 'blue-grad' : 'dark',
      badgeTheme: item.is_featured ? 'blue-grad' : 'dark',
      btnClass: item.is_featured ? 'btn--card-white' : 'btn--card-blue',
      decor: item.is_featured,
    }));
  } catch {
    return SERVICES_DATA;
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
