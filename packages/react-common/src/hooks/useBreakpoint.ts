import { useEffect, useState } from 'react';

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

type Breakpoint = keyof typeof breakpoints;

function getBreakpoint(width: number): Breakpoint {
  if (width < breakpoints.sm) return 'sm';
  if (width < breakpoints.md) return 'md';
  if (width < breakpoints.lg) return 'lg';
  return 'xl';
}

export function useBreakpoint() {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry?.contentRect.width ?? breakpoints.lg);
    });
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  const isReady = width !== null;
  const resolvedWidth = width ?? breakpoints.lg;
  const breakpoint = getBreakpoint(resolvedWidth);

  return {
    isReady,
    breakpoint,
    isMobile: isReady && resolvedWidth < breakpoints.md,
    isTablet: isReady && resolvedWidth >= breakpoints.md && resolvedWidth < breakpoints.lg,
    isDesktop: isReady && resolvedWidth >= breakpoints.lg,
  };
}
