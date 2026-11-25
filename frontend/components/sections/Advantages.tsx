'use client';

import { useModal } from '@/hooks/useModal';
import { ADVANTAGES_DATA } from '@/lib/siteData';
import { RevealTitle } from '@/components/ui/RevealTitle';

type AdvantagesProps = {
  isStandalone?: boolean;
};

export function Advantages({ isStandalone = false }: AdvantagesProps) {
  const { openModal } = useModal();

  return (
    <section
      className={`advantages ${isStandalone ? 'advantages--standalone' : ''}`}
      id={isStandalone ? undefined : 'advantages'}
    >
      <div className="advantages__container">
        <div className="advantages__intro">
          {isStandalone ? (
            <RevealTitle as="h1" className="advantages__title">
              Почему стоит{' '}
              <span className="advantages__title-accent">выбрать нас</span>
            </RevealTitle>
          ) : (
            <RevealTitle as="h2" className="advantages__title">
              Почему стоит{' '}
              <span className="advantages__title-accent">выбрать нас</span>
            </RevealTitle>
          )}
          <button
            type="button"
            className="btn btn--primary-lg advantages__btn"
            onClick={() => openModal()}
          >
            Получить консультацию
          </button>
        </div>

        <div className="advantages__rows">
          {ADVANTAGES_DATA.map((row, idx) => (
            <div key={idx} className="advantages__row">
              <div className="advantages__row-head">
                <span className="advantages__bullet"></span>
                <h3 className="advantages__row-title">{row.title}</h3>
              </div>
              <p className="advantages__row-desc">{row.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
