'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useBreakpoint } from '@repo/react-common/hooks';
import { Spinner } from '@repo/react-common/spinner';

import { useAllItems } from '../queries';

import DesktopItemsTable from './DesktopItemsTable';
import ItemDeleteModal from './ItemDeleteModal';
import { ItemFilter, ItemFilterState } from './ItemFilter';
import MobileItemsList from './MobileItemsList';

const SEARCH_DEBOUNCE_MS = 300;

export default function ItemsView() {
  const { isReady, isDesktop } = useBreakpoint();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data = [], isLoading } = useAllItems();
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  // searchDraft gives immediate input feedback; URL is updated with debounce
  const [searchDraft, setSearchDraft] = useState(() => searchParams.get('search') ?? '');
  const searchDraftRef = useRef(searchDraft);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount: if URL has no sort params, restore last saved sort from sessionStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sort') || params.get('dir')) return;
    const savedSort = sessionStorage.getItem('itemSortField');
    const savedDir = sessionStorage.getItem('itemSortDir');
    if (!savedSort && !savedDir) return;
    if (savedSort && savedSort !== 'name') params.set('sort', savedSort);
    if (savedDir && savedDir !== 'asc') params.set('dir', savedDir);
    const qs = params.toString();
    if (qs) router.replace(`${pathname}?${qs}`);
  }, [pathname, router]);

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

  const filterState: ItemFilterState = useMemo(() => {
    const rawSort = searchParams.get('sort');
    const rawDir = searchParams.get('dir');
    return {
      search: searchParams.get('search') ?? '',
      category: searchParams.get('category') ?? '',
      sortField: rawSort === 'weight' || rawSort === 'category' ? rawSort : 'name',
      sortDirection: rawDir === 'desc' ? 'desc' : 'asc',
    };
  }, [searchParams]);

  const displayFilterState: ItemFilterState = { ...filterState, search: searchDraft };

  const filteredItems = useMemo(() => {
    let result = [...data];

    if (searchDraft) {
      const term = searchDraft.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          (item.description?.toLowerCase().includes(term) ?? false),
      );
    }

    if (filterState.category) {
      result = result.filter((item) => item.category?.name === filterState.category);
    }

    result.sort((a, b) => {
      let cmp: number;
      if (filterState.sortField === 'weight') {
        cmp = (a.weight ?? 0) - (b.weight ?? 0);
      } else if (filterState.sortField === 'name') {
        cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      } else if (filterState.sortField === 'category') {
        cmp = (a.category?.name ?? '')
          .toLowerCase()
          .localeCompare((b.category?.name ?? '').toLowerCase());
      } else {
        cmp = 0;
      }
      if (cmp === 0 && filterState.sortField !== 'name') {
        cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      }
      return filterState.sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [data, searchDraft, filterState.category, filterState.sortField, filterState.sortDirection]);

  const handleFilterChange = useCallback(
    (updates: Partial<ItemFilterState>) => {
      if (updates.search !== undefined) {
        searchDraftRef.current = updates.search;
        setSearchDraft(updates.search);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
          // Read fresh params at fire time to avoid overwriting concurrent filter changes
          const params = new URLSearchParams(window.location.search);
          if (searchDraftRef.current) {
            params.set('search', searchDraftRef.current);
          } else {
            params.delete('search');
          }
          router.replace(`${pathname}?${params.toString()}`);
        }, SEARCH_DEBOUNCE_MS);
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      if (updates.category !== undefined) {
        if (updates.category) params.set('category', updates.category);
        else params.delete('category');
      }
      if (updates.sortField !== undefined) {
        if (updates.sortField !== 'name') params.set('sort', updates.sortField);
        else params.delete('sort');
        sessionStorage.setItem('itemSortField', updates.sortField);
      }
      if (updates.sortDirection !== undefined) {
        if (updates.sortDirection !== 'asc') params.set('dir', updates.sortDirection);
        else params.delete('dir');
        sessionStorage.setItem('itemSortDir', updates.sortDirection);
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleEditItem = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('action', 'edit-item');
      params.set('id', id);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleDeleteItem = useCallback((id: string) => {
    setDeleteItemId(id);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteItemId(null);
  }, []);

  if (!isReady) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  const deleteItemModal = deleteItemId && (
    <ItemDeleteModal itemId={deleteItemId} onClose={closeDeleteModal} />
  );

  if (!isDesktop) {
    return (
      <>
        <div className="flex w-full max-w-3xl flex-col gap-4 p-4">
          <ItemFilter filterState={displayFilterState} onChange={handleFilterChange} />
          <MobileItemsList
            items={filteredItems}
            isLoading={isLoading}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
          />
        </div>
        {deleteItemModal}
      </>
    );
  }

  return (
    <>
      <div className="flex h-full w-full flex-col gap-4 p-4">
        <ItemFilter filterState={displayFilterState} onChange={handleFilterChange} />
        <div className="min-h-0 flex-1">
          <DesktopItemsTable
            items={filteredItems}
            isLoading={isLoading}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
          />
        </div>
      </div>
      {deleteItemModal}
    </>
  );
}
