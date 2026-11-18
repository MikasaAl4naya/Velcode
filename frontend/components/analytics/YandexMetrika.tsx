'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export const COOKIE_STORAGE_KEY = 'velcode_cookie_consent';
export const COOKIE_CONSENT_EVENT = 'velcode_cookie_consent_accepted';
export const YM_ID = 112272348;

export function YandexMetrika() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(COOKIE_STORAGE_KEY) === 'accepted') {
        setHasConsent(true);
      }
    } catch {
      // ignore
    }

    const handleConsent = () => {
      setHasConsent(true);
    };

    window.addEventListener(COOKIE_CONSENT_EVENT, handleConsent);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, handleConsent);
    };
  }, []);

  if (!hasConsent) return null;

  return (
    <>
      <Script
        id="yandex-metrika"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();
for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
ym(${YM_ID},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});`,
        }}
      />
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${YM_ID}`}
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
