'use client';

import { useModal } from '@/hooks/useModal';
import type { ServiceData } from '@/lib/siteData';

type ServiceCardProps = {
  card: ServiceData;
  onSelect?: (card: ServiceData) => void;
};

export function ServiceCard({ card, onSelect }: ServiceCardProps) {
  const { openModal } = useModal();

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSelect) {
      onSelect(card);
    } else {
      openModal(card);
    }
  };

  const cardClasses = [
    'service-card',
    `service-card--${card.theme}`,
    card.decor ? 'service-card--decor' : '',
  ].filter(Boolean).join(' ');

  return (
    <article className={cardClasses}>
      <div className="service-card__head">
        <span className="service-card__num">{card.num}</span>
        <h3
          className="service-card__name"
          dangerouslySetInnerHTML={{ __html: (card.name || card.title || '').replace(/\n/g, '<br />') }}
        />
        {card.desc && card.theme === 'outline' && (
          <p className="service-card__text">{card.desc}</p>
        )}
      </div>

      {card.price ? (
        <div className="service-card__foot">
          <div className="service-card__cost">
            <span className="service-card__cost-val">{card.price}</span>
            <span className="service-card__cost-sub">{card.unit}</span>
          </div>
          <button
            type="button"
            className={`btn ${card.btnClass || 'btn--card-white'}`}
            onClick={handleOpen}
          >
            Подробнее
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn--card-dark"
          onClick={handleOpen}
        >
          Получить консультацию
        </button>
      )}
    </article>
  );
}
