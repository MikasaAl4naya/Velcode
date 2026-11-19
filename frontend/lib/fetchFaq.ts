export interface FaqData {
  id: number;
  question: string;
  answer: string;
}

export const FAQ_DATA: FaqData[] = [
  {
    id: 1,
    question: 'Сколько стоит разработка под ключ',
    answer:
      'Стоимость рассчитывается индивидуально в зависимости от масштаба: лендинги — от 30 000 ₽, корпоративные сайты — от 50 000 ₽, веб-сервисы и магазины — от 90 000 ₽. Смета и график фиксируются в договоре.',
  },
  {
    id: 2,
    question: 'Какие услуги вы предоставляете',
    answer:
      'Мы предоставляем полный спектр цифровых решений: разработку современных сайтов и сервисов на Next.js и FastAPI, интеграцию с 1С и Битрикс24, внедрение ИИ-ассистентов, рекламу и SEO-продвижение.',
  },
  {
    id: 3,
    question: 'Какие вы даете гарантии на работу',
    answer:
      'Мы работаем строго по официальному договору ИП с актами приёмки. Предоставляем 60 дней бесплатной гарантийной поддержки на весь разработанный функционал после релиза проекта.',
  },
  {
    id: 4,
    question: 'Какие сроки разработки сайта или сервиса?',
    answer:
      'Лендинг создаётся за 7–14 рабочих дней, корпоративный сайт — за 3–5 недель, а сложные сервисы с интеграцией 1С — от 1.5 до 3 месяцев. Сроки закрепляются в договоре.',
  },
  {
    id: 5,
    question: 'Как устроена оплата и есть ли предоплата?',
    answer:
      'Стандартная схема оплаты: 50% предоплата перед стартом проектирования и дизайна, оставшиеся 50% — после демонстрации готового решения на тестовом сервере и подписания актов.',
  },
];

const API_BASE =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:8000';

export async function fetchFaq(): Promise<FaqData[]> {
  try {
    const res = await fetch(`${API_BASE}/api/faq`, { next: { revalidate: 3600 } });
    if (!res.ok) return FAQ_DATA;
    const data: Array<{ id: number; question: string; answer: string; sort_order?: number }> = await res.json();
    if (!data || !data.length) return FAQ_DATA;
    return data.map((item) => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
    }));
  } catch {
    return FAQ_DATA;
  }
}
