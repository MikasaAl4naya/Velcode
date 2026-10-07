'use client'

import { useState } from 'react'
import { createLead } from '@/lib/api'

type Field = { name: string; phone: string; question: string; consent: boolean }
type Errors = Partial<Record<keyof Field, string>>

function validate(f: Field): Errors {
  const e: Errors = {}
  if (!f.name.trim()) e.name = 'Укажите имя'
  if (f.phone.replace(/\D/g, '').length < 10) e.phone = 'Укажите корректный номер'
  if (!f.consent) e.consent = 'Необходимо согласие'
  return e
}

const fieldStyle: React.CSSProperties = {
  width: '100%', background: 'transparent', border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.5)',
  padding: '0 8px', height: 60, fontSize: 16, color: '#ffffff',
  outline: 'none', boxSizing: 'border-box', letterSpacing: '-0.32px',
}

export default function ContactForm() {
  const [form, setForm] = useState<Field>({ name: '', phone: '', question: '', consent: false })
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [serverError, setServerError] = useState('')

  const set = (key: keyof Field, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setStatus('loading')
    const res = await createLead({
      name: form.name.trim(), phone: form.phone.trim(),
      question: form.question.trim() || undefined,
      source: 'contact_form', consent: form.consent,
    })
    if (res.ok) { setStatus('ok') }
    else { setStatus('error'); setServerError(res.error ?? 'Ошибка отправки') }
  }

  if (status === 'ok') {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 20, color: '#7183BD' }}>✓</div>
        <p style={{ fontSize: 20, fontWeight: 500, color: '#ffffff', margin: '0 0 10px' }}>Заявка принята!</p>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Свяжемся с вами в ближайшее время.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <div>
          <input
            type="text"
            placeholder="Ваше имя"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            style={{
              ...fieldStyle,
              borderBottomColor: errors.name ? '#ff6b6b' : 'rgba(255,255,255,0.5)',
            }}
          />
          {errors.name && (
            <p style={{ color: '#d41717', fontSize: 12, margin: '4px 0 0', fontWeight: 500 }}>{errors.name}</p>
          )}
        </div>

        <div>
          <input
            type="tel"
            placeholder="+7 (999) 999-99-99"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            style={{
              ...fieldStyle,
              borderBottomColor: errors.phone ? '#ff6b6b' : 'rgba(255,255,255,0.5)',
            }}
          />
          {errors.phone && (
            <p style={{ color: '#d41717', fontSize: 12, margin: '4px 0 0', fontWeight: 500 }}>{errors.phone}</p>
          )}
        </div>

        <input
          type="text"
          placeholder="Ваш вопрос"
          value={form.question}
          onChange={e => set('question', e.target.value)}
          style={fieldStyle}
        />
      </div>

      {/* Consent + button */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        paddingTop: 30, paddingBottom: 10,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, paddingRight: 20 }}>
          {errors.consent && (
            <p style={{ color: '#d41717', fontSize: 12, margin: 0, fontWeight: 500 }}>
              {errors.consent}
            </p>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div
              onClick={() => set('consent', !form.consent)}
              style={{
                width: 20, height: 20, borderRadius: 28,
                border: '1px solid #ffffff',
                background: form.consent ? '#7183BD' : 'transparent',
                flexShrink: 0, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {form.consent && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span style={{ fontSize: 15, color: '#ffffff', lineHeight: 1.4, letterSpacing: '-0.3px' }}>
              Даю{' '}
              <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Согласие</span>
              {' '}на обработку персональных данных в соответствии с{' '}
              <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Политикой</span>
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            background: '#ffffff', color: '#171819',
            fontSize: 16, fontWeight: 500,
            height: 54, padding: '0 24px',
            borderRadius: 28, border: 'none',
            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            opacity: status === 'loading' ? 0.6 : 1,
            fontFamily: 'inherit', flexShrink: 0, whiteSpace: 'nowrap',
          }}
        >
          {status === 'loading' ? 'Отправка...' : 'Отправить'}
        </button>
      </div>

      {status === 'error' && (
        <p style={{ color: '#ff6b6b', fontSize: 13, margin: '8px 0 0' }}>{serverError}</p>
      )}
    </form>
  )
}
