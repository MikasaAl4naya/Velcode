'use client';

import { useModal } from '@/hooks/useModal';
import { ADVANTAGES_DATA } from '@/lib/siteData';

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
            <h1 className="advantages__title">
              <span className="advantages__title-line">Почему стоит</span>
              <span className="advantages__title-line advantages__title-line--accent">
                выбрать нас
              </span>
            </h1>
          ) : (
            <h2 className="advantages__title">
              <span className="advantages__title-line">Почему стоит</span>
              <span className="advantages__title-line advantages__title-line--accent">
                выбрать нас
              </span>
            </h2>
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
