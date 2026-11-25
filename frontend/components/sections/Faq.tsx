'use client';

import { useState } from 'react';
import type { FaqData } from '@/lib/fetchFaq';
import { RevealTitle } from '@/components/ui/RevealTitle';
import { renderMarkdownLinks } from '@/lib/renderMarkdownLinks';

type FaqProps = {
  isStandalone?: boolean;
  items: FaqData[];
};

export function Faq({ isStandalone = false, items }: FaqProps) {
  const [openId, setOpenId] = useState<number | null>(null);

  const toggle = (id: number) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  if (!items || items.length === 0) return null;

  return (
    <section className={`faq ${isStandalone ? 'faq--standalone' : ''}`} id="faq">
      <div className="faq__container">
        <div className="faq__intro">
          {isStandalone ? (
            <RevealTitle as="h1" className="faq__title">
              FAQ
            </RevealTitle>
          ) : (
            <RevealTitle as="h2" className="faq__title">
              FAQ
            </RevealTitle>
          )}
          <p className="faq__subtitle">Вопросы и ответы</p>
        </div>

        <div className="faq__accordion">
          {items.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className={`faq__item ${isOpen ? 'is-open' : ''}`}
              >
                <button
                  type="button"
                  className="faq__trigger"
                  onClick={() => toggle(item.id)}
                  aria-expanded={isOpen}
                >
                  <span className="faq__question">{item.question}</span>
                  <span className="faq__icon" aria-hidden="true">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 2V14M2 8H14"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </button>

                <div className="faq__body">
                  <div className="faq__content">
                    <p className="faq__answer">{renderMarkdownLinks(item.answer, 'faq__link')}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
