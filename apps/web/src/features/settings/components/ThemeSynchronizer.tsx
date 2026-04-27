'use client';

import { useEffect } from 'react';

import { usePreferences } from '../queries';

export function ThemeSynchronizer() {
  const { data, isLoading, isError } = usePreferences();
  const theme = data?.theme ?? null;

  useEffect(() => {
    if (isLoading || isError) return;

    const html = document.documentElement;
    html.classList.remove('light', 'dark');

    if (theme) {
      html.classList.add(theme);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applySystemTheme = (e: MediaQueryList | MediaQueryListEvent) => {
      html.classList.remove('light', 'dark');
      html.classList.add(e.matches ? 'dark' : 'light');
    };

    applySystemTheme(mediaQuery);
    mediaQuery.addEventListener('change', applySystemTheme);
    return () => mediaQuery.removeEventListener('change', applySystemTheme);
  }, [theme, isLoading, isError]);

  return null;
}
