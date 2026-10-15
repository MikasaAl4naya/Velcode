export type Category = {
  id: number
  name: string
  icon: string | null
  sort_order: number
}

export type Service = {
  id: number
  title: string
  description: string
  price_full: number
  price_discount: number | null
  unit: string
  image_url: string | null
  sort_order: number
  categories: Category[]
}

export type FaqItem = {
  id: number
  question: string
  answer: string
  sort_order: number
}

export type PortfolioItem = {
  id: number
  title: string
  description: string
  image_url: string | null
  site_url: string | null
  tags: string | null
  sort_order: number
}

export type LeadCreate = {
  name: string
  phone: string
  question?: string
  source?: string
  consent: boolean
}

// Server components use INTERNAL_API_URL (direct to FastAPI, never exposed to browser).
// Client components use NEXT_PUBLIC_API_URL — empty string in production
// means the browser calls /api/... through nginx on the same domain.
const serverBase =
  process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000'

const clientBase =
  typeof window === 'undefined'
    ? serverBase
    : (process.env.NEXT_PUBLIC_API_URL ?? '')

async function apiFetch(path: string, init?: RequestInit) {
  const base = typeof window === 'undefined' ? serverBase : clientBase
  const res = await fetch(`${base}${path}`, init)
  return res
}

export async function getCategories(): Promise<Category[]> {
  try {
    const res = await apiFetch('/api/categories', { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getServices(): Promise<Service[]> {
  try {
    const res = await apiFetch('/api/services', { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getFaq(): Promise<FaqItem[]> {
  try {
    const res = await apiFetch('/api/faq', { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getPortfolio(): Promise<PortfolioItem[]> {
  try {
    const res = await apiFetch('/api/portfolio', { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function createLead(data: LeadCreate): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await apiFetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const msg = body?.detail?.[0]?.msg ?? 'Ошибка сервера'
      return { ok: false, error: msg }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Нет связи с сервером' }
  }
}
