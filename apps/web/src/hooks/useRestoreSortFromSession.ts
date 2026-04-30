'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface Options {
  sortFieldKey: string;
  sortDirKey: string;
  defaultSortField: string;
}

export function useRestoreSortFromSession({ sortFieldKey, sortDirKey, defaultSortField }: Options) {
  const router = useRouter();
  const pathname = usePathname();

  // On mount: if URL has no sort params, restore last saved sort from sessionStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sort') || params.get('dir')) return;
    const savedSort = sessionStorage.getItem(sortFieldKey);
    const savedDir = sessionStorage.getItem(sortDirKey);
    if (!savedSort && !savedDir) return;
    if (savedSort && savedSort !== defaultSortField) params.set('sort', savedSort);
    if (savedDir && savedDir !== 'asc') params.set('dir', savedDir);
    const qs = params.toString();
    if (qs) router.replace(`${pathname}?${qs}`);
  }, [pathname, router, sortFieldKey, sortDirKey, defaultSortField]);
}
