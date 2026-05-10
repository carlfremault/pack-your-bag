'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface Options {
  sortFieldKey: string;
  sortDirKey: string;
  defaultSortField: string;
}

interface SessionSort {
  field: string | null;
  dir: string | null;
}

export function useRestoreSortFromSession({
  sortFieldKey,
  sortDirKey,
  defaultSortField,
}: Options): SessionSort {
  const router = useRouter();
  const pathname = usePathname();

  const [sessionSort] = useState<SessionSort>(() => {
    if (typeof window === 'undefined') return { field: null, dir: null };
    return {
      field: sessionStorage.getItem(sortFieldKey),
      dir: sessionStorage.getItem(sortDirKey),
    };
  });

  // Keep URL in sync with session preference (no-op if URL already has sort params)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sort') || params.get('dir')) return;
    if (!sessionSort.field && !sessionSort.dir) return;
    if (sessionSort.field && sessionSort.field !== defaultSortField)
      params.set('sort', sessionSort.field);
    if (sessionSort.dir && sessionSort.dir !== 'asc') params.set('dir', sessionSort.dir);
    const queryString = params.toString();
    if (queryString) router.replace(`${pathname}?${queryString}`);
  }, [pathname, router, sessionSort, defaultSortField]);

  return sessionSort;
}
