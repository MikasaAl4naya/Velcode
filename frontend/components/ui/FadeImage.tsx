'use client';

import { useEffect, useRef, useState } from 'react';

type Props = React.ImgHTMLAttributes<HTMLImageElement>;

export function FadeImage({ style, onLoad, ...props }: Props) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (ref.current?.complete) setLoaded(true);
  }, []);

  return (
    <img
      ref={ref}
      {...props}
      style={{ ...style, opacity: loaded ? 1 : 0, transition: 'opacity 0.35s ease' }}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
    />
  );
}
