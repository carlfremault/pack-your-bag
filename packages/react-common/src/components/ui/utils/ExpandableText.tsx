'use client';

import { useLayoutEffect, useRef, useState } from 'react';

export interface ExpandableTextProps {
  text: string;
  maxLines?: number;
}
const clampClass: Record<number, string> = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
  5: 'line-clamp-5',
  6: 'line-clamp-6',
};

export function ExpandableText(props: ExpandableTextProps) {
  const { text, maxLines = 2 } = props;
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setIsClamped(el.scrollHeight > el.clientHeight);
  }, [text, maxLines]);

  return (
    <div className="text-xs font-light">
      <p
        ref={ref}
        className={`wrap-break-word ${expanded ? '' : (clampClass[maxLines] ?? 'line-clamp-2')}`}
      >
        {text}
      </p>
      {isClamped && (
        <button
          type="button"
          className="focus-visible:ring-primary-ring mt-0.5 cursor-pointer underline underline-offset-2 hover:opacity-70 focus-visible:ring-2 focus-visible:outline-none"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          {expanded ? 'read less' : 'read more'}
        </button>
      )}
    </div>
  );
}
