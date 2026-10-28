import { SERVICES_DATA, type ServiceData } from '@/lib/siteData';

const API_BASE =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:8000';

export async function fetchServices(): Promise<ServiceData[]> {
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
      image_url: string | null;
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
      decor: Boolean(item.image_url),
    }));
  } catch {
    return SERVICES_DATA;
  }
}
