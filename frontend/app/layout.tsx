import type { Metadata } from 'next';
import './globals.css';
import { ModalProvider } from '@/components/ModalProvider';
import { SvgSprite } from '@/components/ui/SvgSprite';
import { CookieBanner } from '@/components/ui/CookieBanner';

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  title: 'Велкод — разработка сайтов и автоматизация бизнеса',
  description:
    'Велкод: разработка сайтов под ключ, настройка рекламы и автоматизация бизнеса в Иркутске. Битрикс24, 1С, чат-боты и ИИ-ассистенты. Оставьте заявку!',
  keywords:
    'разработка сайта, автоматизация бизнес процессов, создание ии-ассистентов, внедрение битрикс, сайт под ключ',
  openGraph: {
    title: 'Велкод — разработка сайтов и автоматизация бизнеса',
    description:
      'Разработка сайтов под ключ, настройка рекламы и автоматизация бизнеса в Иркутске.',
    url: 'https://velcode.ru',
    locale: 'ru_RU',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();
for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
ym(112272348,"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});`,
          }}
        />
        <noscript>
          <div>
            <img src="https://mc.yandex.ru/watch/112272348" style={{position:'absolute',left:'-9999px'}} alt="" />
          </div>
        </noscript>
      </head>
      <body className="page">
        <SvgSprite />
        <ModalProvider>
          {children}
          <CookieBanner />
        </ModalProvider>
      </body>
    </html>
  );
}
