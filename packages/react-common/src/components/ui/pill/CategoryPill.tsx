'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import classNames from 'classnames';

import { type ColorTheme, colorThemes } from '#lib/colorThemes';

const DEFAULT_THEME: ColorTheme = 'slate';

export interface CategoryPillProps {
  name: string;
  colorTheme?: ColorTheme;
}

export function CategoryPill({ name, colorTheme }: CategoryPillProps) {
  const pillRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    if (!tooltip || !tooltipRef.current) return;
    const el = tooltipRef.current;
    const rect = el.getBoundingClientRect();
    const padding = 8;

    let left = tooltip.x;
    if (rect.left < padding) {
      left += padding - rect.left;
    } else if (rect.right > window.innerWidth - padding) {
      left -= rect.right - (window.innerWidth - padding);
    }

    el.style.left = `${left}px`;
  }, [tooltip]);

  const handleMouseEnter = () => {
    const el = pillRef.current;
    if (!el || el.scrollWidth <= el.offsetWidth) return; // only if truncated
    const rect = el.getBoundingClientRect();
    setTooltip({ x: rect.left + rect.width / 2, y: rect.top });
  };

  const resolvedTheme = (
    colorTheme && colorTheme in colorThemes ? colorTheme : DEFAULT_THEME
  ) as ColorTheme;

  const { className: colorThemeClassName } = colorThemes[resolvedTheme];

  const categoryPillClassName = classNames(
    'uppercase font-medium rounded-xl border px-1.5 py-0.5 text-[10px]',
    'block w-fit max-w-full break-words whitespace-normal align-bottom',
    'lg:inline-block lg:truncate lg:whitespace-nowrap lg:break-normal',
    colorThemeClassName,
  );

  return (
    <>
      <span
        ref={pillRef}
        className={categoryPillClassName}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setTooltip(null)}
      >
        {name}
      </span>
      {tooltip &&
        createPortal(
          <span
            ref={tooltipRef}
            className="bg-surface border-primary-ring pointer-events-none fixed z-50 max-w-xs -translate-x-1/2 -translate-y-full rounded border px-2 py-1 text-xs wrap-break-word shadow-md"
            style={{ left: tooltip.x, top: tooltip.y - 4 }}
          >
            {name}
          </span>,
          document.body,
        )}
    </>
  );
}
