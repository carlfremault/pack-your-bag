'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface TooltipProps {
  text: string;
  className?: string;
  children: React.ReactNode;
}
export function Tooltip(props: TooltipProps) {
  const { text, className, children } = props;

  const wrapperRef = useRef<HTMLSpanElement>(null);
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
    const el = wrapperRef.current;
    if (!el) return;
    const child = el.firstElementChild as HTMLElement | null;
    const target = child ?? el;
    if (target.scrollWidth <= target.offsetWidth && target.scrollHeight <= target.offsetHeight)
      return;
    const rect = el.getBoundingClientRect();
    setTooltip({ x: rect.left + rect.width / 2, y: rect.top });
  };

  const handleFocus = () => {
    handleMouseEnter();
  };

  return (
    <span
      ref={wrapperRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setTooltip(null)}
      onFocus={handleFocus}
      onBlur={() => setTooltip(null)}
      className={className}
    >
      {children}
      {tooltip &&
        typeof document !== 'undefined' &&
        createPortal(
          <span
            ref={tooltipRef}
            className="bg-surface border-primary-ring pointer-events-none fixed z-50 max-w-xs -translate-x-1/2 -translate-y-full rounded border px-2 py-1 text-xs wrap-break-word shadow-md"
            style={{ left: tooltip.x, top: tooltip.y - 4 }}
          >
            {text}
          </span>,
          document.body,
        )}
    </span>
  );
}
