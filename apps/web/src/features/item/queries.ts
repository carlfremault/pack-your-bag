import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { toHttpError } from '@/utils/http-error';

import { Item } from './types';

const fetchAllItems = async (): Promise<Item[]> => {
  const res = await fetch('/api/item');

  if (!res.ok) {
    throw await toHttpError(res);
  }
  const { data } = await res.json();
  return data;
};

const useAllItems = (): UseQueryResult<Item[]> => {
  return useQuery({
    queryKey: ['items'],
    queryFn: fetchAllItems,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export { fetchAllItems, useAllItems };
