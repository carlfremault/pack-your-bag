'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { CategoryPill, type CategoryPillProps } from '../pill/CategoryPill';

export interface CategoryWeightEntry {
  category: CategoryPillProps;
  weight: string;
}

export interface ExpandableCategoryPillsProps {
  items: CategoryWeightEntry[];
}

export function ExpandableCategoryPills({ items }: ExpandableCategoryPillsProps) {
  const [expanded, setExpanded] = useState(false);
  const [hiddenCount, setHiddenCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const measureHidden = useCallback(() => {
    const el = containerRef.current;
    if (!el || expanded) return;
    const containerBottom = el.getBoundingClientRect().bottom;
    const children = Array.from(el.children) as HTMLElement[];
    const hidden = children.filter(
      (c) => c.getBoundingClientRect().bottom > containerBottom,
    ).length;
    setHiddenCount(hidden);
  }, [expanded]);

  useLayoutEffect(() => {
    measureHidden();
  }, [measureHidden, items]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(measureHidden);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measureHidden]);

  return (
    <div className="flex flex-col gap-1">
      <div
        ref={containerRef}
        className={`flex flex-col gap-2${expanded ? '' : 'max-h-[clamp(5.5rem,15dvh,18rem)] overflow-hidden'}`}
      >
        {items.map(({ category, weight }, index) => (
          <div
            key={`${category.name}-${index}`}
            className="flex items-center justify-between gap-2"
          >
            <CategoryPill {...category} />
            <div className="text-xs text-nowrap">{weight}</div>
          </div>
        ))}
      </div>
      {(hiddenCount > 0 || expanded) && (
        <button
          type="button"
          className="focus-visible:ring-primary-ring mt-0.5 cursor-pointer self-start text-xs underline underline-offset-2 hover:opacity-70 focus-visible:ring-2 focus-visible:outline-none"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          {expanded ? 'show less' : `and ${hiddenCount} more`}
        </button>
      )}
    </div>
  );
}
