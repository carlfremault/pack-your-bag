'use client';

import { useEffect, useRef, useState } from 'react';

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

  useEffect(() => {
    const el = ref.current;
    if (el) setIsClamped(el.scrollHeight > el.clientHeight);
  }, [text]);

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
          className="mt-0.5 cursor-pointer underline underline-offset-2 hover:opacity-70"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          {expanded ? 'read less' : 'read more'}
        </button>
      )}
    </div>
  );
}
