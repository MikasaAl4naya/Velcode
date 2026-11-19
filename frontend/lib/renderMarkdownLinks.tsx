import React from 'react';
import Link from 'next/link';

/**
 * Рендерит строку с поддержкой markdown-ссылок вида [текст](url)
 * Внутренние ссылки (начинающиеся с '/') открываются в текущей вкладке через Next.js Link,
 * внешние — в новой вкладке с target="_blank" и rel="noopener noreferrer".
 */
export function renderMarkdownLinks(text: string, linkClassName?: string): React.ReactNode[] {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const label = match[1];
    const href = match[2];
    const isInternal = href.startsWith('/');

    parts.push(
      <Link
        key={`${match.index}-${href}`}
        href={href}
        className={linkClassName}
        target={isInternal ? undefined : '_blank'}
        rel={isInternal ? undefined : 'noopener noreferrer'}
      >
        {label}
      </Link>
    );
    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}
