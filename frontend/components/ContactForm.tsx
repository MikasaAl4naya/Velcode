'use client'

import { useState } from 'react'
import { createLead } from '@/lib/api'

type Field = { name: string; phone: string; question: string; consent: boolean }
type Errors = Partial<Record<keyof Field, string>>

function validate(f: Field): Errors {
  const e: Errors = {}
  if (!f.name.trim()) e.name = 'Укажите имя'
  const digits = f.phone.replace(/\D/g, '')
  if (digits.length < 10) e.phone = 'Укажите корректный номер телефона'
  if (!f.consent) e.consent = 'Необходимо согласие'
  return e
}

export default function ContactForm() {
  const [form, setForm] = useState<Field>({
    name: '',
    phone: '',
    question: '',
    consent: false,
  })
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [serverError, setServerError] = useState('')

  const set = (key: keyof Field, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setStatus('loading')
    const res = await createLead({
      name: form.name.trim(),
      phone: form.phone.trim(),
      question: form.question.trim() || undefined,
      source: 'contact_form',
      consent: form.consent,
    })

    if (res.ok) {
      setStatus('ok')
    } else {
      setStatus('error')
      setServerError(res.error ?? 'Ошибка отправки')
    }
  }

  if (status === 'ok') {
    return (
      <div className="text-center py-10">
        <div className="text-5xl mb-4">✓</div>
        <p className="text-white text-xl font-semibold mb-2">Заявка принята!</p>
        <p className="text-white/70">Свяжемся с вами в ближайшее время.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <input
          type="text"
          placeholder="Ваше имя *"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-white/50 outline-none focus:border-[#2583FF] transition-colors ${
            errors.name ? 'border-red-400' : 'border-white/20'
          }`}
        />
        {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <input
          type="tel"
          placeholder="Телефон *"
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-white/50 outline-none focus:border-[#2583FF] transition-colors ${
            errors.phone ? 'border-red-400' : 'border-white/20'
          }`}
        />
        {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
      </div>

      <div>
        <textarea
          placeholder="Вопрос или комментарий"
          value={form.question}
          onChange={(e) => set('question', e.target.value)}
          rows={4}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 outline-none focus:border-[#2583FF] transition-colors resize-none"
        />
      </div>

      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => set('consent', e.target.checked)}
            className="mt-0.5 shrink-0 accent-[#2583FF]"
          />
          <span className="text-white/70 text-[13px] leading-snug">
            Я согласен(а) на обработку персональных данных в соответствии с
            политикой конфиденциальности
          </span>
        </label>
        {errors.consent && (
          <p className="text-red-400 text-sm mt-1">{errors.consent}</p>
        )}
      </div>

      {status === 'error' && (
        <p className="text-red-400 text-sm">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="bg-[#2583FF] hover:bg-[#0872FF] disabled:opacity-60 text-white font-semibold px-7 py-3.5 rounded-lg transition-colors text-[15px] mt-2"
      >
        {status === 'loading' ? 'Отправка...' : 'Отправить заявку ↗'}
      </button>
    </form>
  )
}
