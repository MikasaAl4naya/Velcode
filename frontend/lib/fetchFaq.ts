export interface FaqData {
  id: number;
  question: string;
  answer: string;
}

export const FAQ_DATA: FaqData[] = [];

const API_BASE =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:8000';

export async function fetchFaq(): Promise<FaqData[]> {
  try {
    const res = await fetch(`${API_BASE}/api/faq`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data: Array<{ id: number; question: string; answer: string; sort_order?: number }> = await res.json();
    if (!data || !data.length) return [];
    return data.map((item) => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
    }));
  } catch {
    return [];
  }
}
