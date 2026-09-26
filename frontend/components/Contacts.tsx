import ContactForm from './ContactForm'

export default function Contacts() {
  return (
    <section id="contacts" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Напишите нам
            </h2>
            <p className="text-white/60 text-lg mb-8 leading-relaxed">
              Оставьте заявку, и мы свяжемся с вами в течение рабочего дня.
              Расскажем о стоимости, сроках и ответим на все вопросы.
            </p>
            <div className="flex flex-col gap-3 text-white/70 text-[15px]">
              <a
                href="tel:+79956850793"
                className="hover:text-white transition-colors"
              >
                +7 995 685-07-93
              </a>
              <a
                href="mailto:velcode@inbox.ru"
                className="hover:text-white transition-colors"
              >
                velcode@inbox.ru
              </a>
              <div className="flex gap-4 mt-2">
                <a
                  href="https://t.me/VelcodeBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Telegram ↗
                </a>
                <a
                  href="https://max.ru/id381914585931_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Max ↗
                </a>
              </div>
            </div>
          </div>

          <div>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  )
}
