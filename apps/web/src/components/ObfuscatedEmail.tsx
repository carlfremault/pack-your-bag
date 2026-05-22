'use client';

import { useCallback, useState } from 'react';

import classNames from 'classnames';

interface ObfuscatedEmailProps {
  user: string;
  domain: string;
  className?: string;
}

export function ObfuscatedEmail({ user, domain, className }: ObfuscatedEmailProps) {
  const [revealed, setRevealed] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!revealed) {
        setRevealed(true);
        return;
      }
      window.location.href = `mailto:${user}@${domain}`;
    },
    [revealed, user, domain],
  );

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={classNames(className, 'cursor-pointer')}
      >
        {user}[at]{domain}
      </button>
    );
  }

  return (
    <a href={`mailto:${user}@${domain}`} onClick={handleClick} className={className}>
      {user}@{domain}
    </a>
  );
}
