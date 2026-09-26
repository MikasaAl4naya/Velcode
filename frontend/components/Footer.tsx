export default function Footer() {
  return (
    <footer className="bg-black text-white/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px]">
        <p>© {new Date().getFullYear()} Велкод. Все права защищены.</p>
        <div className="flex gap-5">
          <a
            href="https://t.me/VelcodeBot"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Telegram
          </a>
          <a
            href="https://max.ru/id381914585931_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Max
          </a>
          <a
            href="mailto:velcode@inbox.ru"
            className="hover:text-white transition-colors"
          >
            velcode@inbox.ru
          </a>
        </div>
      </div>
    </footer>
  )
}
