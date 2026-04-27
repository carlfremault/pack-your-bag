'use client';

import { useEffect } from 'react';

import { usePreferences } from '../queries';

export function ThemeSynchronizer() {
  const { data, isLoading, isError } = usePreferences();
  const theme = data?.theme ?? null;

  useEffect(() => {
    if (isLoading || isError) return;

    const html = document.documentElement;

    function applyTheme(e?: MediaQueryList | MediaQueryListEvent) {
      html.classList.remove('light', 'dark');
      if (theme) {
        html.classList.add(theme);
      } else {
        const source = e ?? window.matchMedia('(prefers-color-scheme: dark)');
        html.classList.add(source.matches ? 'dark' : 'light');
      }
    }

    applyTheme();

    // Guard against RSC reconciliation overwriting the theme class between React
    // commits and the next effect run. The observer corrects the class immediately
    // (as a microtask, before paint) whenever an external change undoes our work.
    let guarded = false;
    const observer = new MutationObserver(() => {
      if (guarded) return;
      const prefersDark = !theme && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const expected = theme ?? (prefersDark ? 'dark' : 'light');
      if (!html.classList.contains(expected)) {
        guarded = true;
        applyTheme();
        queueMicrotask(() => {
          guarded = false;
        });
      }
    });
    observer.observe(html, { attributes: true, attributeFilter: ['class'] });

    if (theme) {
      return () => observer.disconnect();
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = (e: MediaQueryListEvent) => applyTheme(e);
    mediaQuery.addEventListener('change', onSystemChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', onSystemChange);
    };
  }, [theme, isLoading, isError]);

  return null;
}
