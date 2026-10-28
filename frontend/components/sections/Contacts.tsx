import { LeadForm } from '@/components/ui/LeadForm';
import { SocialLinks } from '@/components/ui/SocialLinks';
import { ContactChannels } from '@/components/ui/ContactChannels';
import { SplitText } from '@/components/ui/SplitText';


type ContactsProps = {
  isStandalone?: boolean;
};

export function Contacts({ isStandalone = false }: ContactsProps) {
  return (
    <section
      className={`contacts ${isStandalone ? 'contacts--standalone' : ''}`}
      id={isStandalone ? undefined : 'contacts'}
    >
      <div className="contacts__container">
        <div className="contacts__card">
          <div className="contacts__side">
            {isStandalone ? (
              <h1 className="contacts__title">
                <SplitText text="Контакты" />
              </h1>
            ) : (
              <h2 className="contacts__title">
                <SplitText text="Контакты" />
              </h2>
            )}
            <p className="contacts__subtitle">
              Остались вопросы? Свяжитесь с нами<br />любым удобным способом
            </p>

            <SocialLinks className="contacts__social-list" itemClassName="contacts__social-item" />

            <ContactChannels className="contacts__channels" linkClassName="contacts__channel-link" />
          </div>

          <div className="contacts__form-wrap">
            <div className="contacts__form-top">
              <div className="contacts__form-text">
                <p className="contacts__form-heading">
                  Оставьте заявку на бесплатную консультацию
                </p>
                <p className="contacts__form-subheading">
                  Изучим текущую ситуацию, покажем слабые места и подскажем, как их закрыть.
                </p>
              </div>
              <svg className="contacts__form-arrow" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 20 20 4M4 4h16v16" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>

            <LeadForm
              theme="dark"
              isLarge={true}
              submitLabel="Отправить"
              submitButtonClass="btn--submit"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
