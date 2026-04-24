'use client';

import { useEffect, useRef, useState } from 'react';

export function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) setIsClamped(el.scrollHeight > el.clientHeight);
  }, [text]);

  return (
    <div className="text-xs font-light">
      <div ref={ref} className={`wrap-break-word ${expanded ? '' : 'line-clamp-2'}`}>
        {text}
      </div>
      {isClamped && (
        <button
          type="button"
          className="mt-0.5 underline underline-offset-2 hover:opacity-70"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          {expanded ? 'read less' : 'read more'}
        </button>
      )}
    </div>
  );
}
