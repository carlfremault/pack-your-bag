'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const SEARCH_DEBOUNCE_MS = 300;

export function useSearchDraft() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchDraft, setSearchDraft] = useState(() => searchParams.get('search') ?? '');
  const searchDraftRef = useRef(searchDraft);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync searchDraft on browser back/forward (popstate) so the input matches the restored URL
  useEffect(() => {
    const handlePopState = () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
      const urlSearch = new URLSearchParams(window.location.search).get('search') ?? '';
      searchDraftRef.current = urlSearch;
      setSearchDraft(urlSearch);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
    };
  }, []);

  const handleSearchChange = (value: string) => {
    searchDraftRef.current = value;
    setSearchDraft(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      // Read fresh params at fire time to avoid overwriting concurrent filter changes
      const params = new URLSearchParams(window.location.search);
      if (searchDraftRef.current) {
        params.set('search', searchDraftRef.current);
      } else {
        params.delete('search');
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, SEARCH_DEBOUNCE_MS);
  };

  return { searchDraft, handleSearchChange };
}
