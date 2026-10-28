'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useModal } from '@/hooks/useModal';
import { ymGoal } from '@/lib/ym';

function formatPhone(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (digits[0] === '8') digits = '7' + digits.slice(1);
  if (digits[0] !== '7') digits = '7' + digits;
  digits = digits.slice(0, 11);

  const code = digits.slice(1, 4);
  const a = digits.slice(4, 7);
  const b = digits.slice(7, 9);
  const c = digits.slice(9, 11);
  let result = '+7';
  if (code) result += ` (${code}`;
  if (a) result += `) ${a}`;
  if (b) result += `-${b}`;
  if (c) result += `-${c}`;
  return result;
}

type LeadFormProps = {
  id?: string;
  theme?: 'light' | 'dark';
  isLarge?: boolean;
  submitLabel?: string;
  submitButtonClass?: string;
  source?: string;
  onSuccess?: (data: any) => void;
};

export function LeadForm({
  id,
  theme = 'light',
  isLarge = false,
  submitLabel = 'Отправить',
  submitButtonClass = 'btn--modal',
  source = 'contact_form',
  onSuccess,
}: LeadFormProps) {
  const { openSuccessModal } = useModal();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    question: '',
    consent: false,
  });

  const [touched, setTouched] = useState({
    name: false,
    phone: false,
    consent: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isNameValid = formData.name.trim().length >= 2;
  const isPhoneValid = formData.phone.replace(/\D/g, '').length === 11;
  const isConsentValid = formData.consent;

  const showNameError = !isNameValid && (submitted || (touched.name && formData.name.trim().length > 0));
  const showPhoneError = !isPhoneValid && (submitted || (touched.phone && formData.phone.length > 0));
  const showConsentError = !isConsentValid && submitted;
  const hasGlobalError = submitted && (!isNameValid || !isPhoneValid || !isConsentValid);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (name === 'phone') {
      setFormData((prev) => ({ ...prev, phone: formatPhone(value) }));
    } else if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);

    if (!isNameValid || !isPhoneValid || !isConsentValid) return;

    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
      const res = await fetch(`${apiUrl}/api/v1/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          question: formData.question,
          consent: formData.consent,
          source,
        }),
      });

      if (res.ok) {
        ymGoal('form_send');
        setFormData({ name: '', phone: '', question: '', consent: false });
        setSubmitted(false);
        setTouched({ name: false, phone: false, consent: false });
        if (openSuccessModal) openSuccessModal();
        if (onSuccess) onSuccess(formData);
      }
    } catch {
      ymGoal('form_send');
      setFormData({ name: '', phone: '', question: '', consent: false });
      setSubmitted(false);
      setTouched({ name: false, phone: false, consent: false });
      if (openSuccessModal) openSuccessModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const formClasses = [
    'lead-form',
    theme === 'dark' ? 'lead-form--dark' : '',
    isLarge ? 'lead-form--large' : '',
  ].filter(Boolean).join(' ');

  return (
    <form id={id} className={formClasses} onSubmit={handleSubmit} noValidate>
      <div className="lead-form__fields">
        <label className={`lead-form__field ${isNameValid ? 'is-valid' : ''} ${showNameError ? 'is-invalid' : ''}`}>
          <input
            className="lead-form__input"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder=" "
            autoComplete="name"
            maxLength={80}
            required
          />
          <span className="lead-form__label">
            Ваше имя <span className="lead-form__required" aria-hidden="true">*</span>
          </span>
          <span className="lead-form__dot" aria-hidden="true"></span>
        </label>

        <label className={`lead-form__field ${isPhoneValid ? 'is-valid' : ''} ${showPhoneError ? 'is-invalid' : ''}`}>
          <input
            className="lead-form__input"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="+7 (999) 999-99-99"
            autoComplete="tel"
            inputMode="tel"
            maxLength={25}
            required
          />
          <span className="lead-form__label">
            Телефон <span className="lead-form__required" aria-hidden="true">*</span>
          </span>
          <span className="lead-form__dot" aria-hidden="true"></span>
        </label>

        <label className="lead-form__field">
          <input
            className="lead-form__input"
            type="text"
            name="question"
            value={formData.question}
            onChange={handleChange}
            placeholder=" "
            maxLength={1000}
          />
          <span className="lead-form__label">Ваш вопрос</span>
        </label>
      </div>

      <div className="lead-form__footer">
        <div className="lead-form__agree">
          {hasGlobalError && (
            <p className="lead-form__error" role="alert">
              Обязательное поле
            </p>
          )}
          <label className={`lead-form__consent ${showConsentError ? 'is-invalid' : ''}`}>
            <input
              className="lead-form__checkbox"
              type="checkbox"
              name="consent"
              checked={formData.consent}
              onChange={handleChange}
              required
            />
            <span className="lead-form__checkmark" aria-hidden="true"></span>
            <span className="lead-form__consent-text">
              Даю{' '}
              <Link
                href="/consent"
                target="_blank"
                rel="noopener noreferrer"
                className="lead-form__link"
              >
                Согласие
              </Link>{' '}
              на обработку персональных данных в&nbsp;соответствии с&nbsp;
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="lead-form__link"
              >
                Политикой
              </Link>
            </span>
          </label>
        </div>

        <button
          className={`btn ${submitButtonClass} lead-form__submit`}
          type="submit"
          disabled={isSubmitting}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
