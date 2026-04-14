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
  // Use a stable initial width for SSR + first client render to avoid hydration mismatch.
  const [width, setWidth] = useState<number>(breakpoints.lg);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry?.contentRect.width ?? breakpoints.lg);
    });
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  const breakpoint = getBreakpoint(width);

  return {
    breakpoint,
    isMobile: width < breakpoints.md,
    isTablet: width >= breakpoints.md && width < breakpoints.lg,
    isDesktop: width >= breakpoints.lg,
  };
}
