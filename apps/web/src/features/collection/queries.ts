import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { toHttpError } from '@/utils/http-error';

import { Collection } from './types';

const fetchAllCollections = async (): Promise<Collection[]> => {
  const res = await fetch('/api/collections');

  if (!res.ok) {
    throw await toHttpError(res);
  }
  const { data } = await res.json();
  return data;
};

const useAllCollections = (): UseQueryResult<Collection[]> => {
  return useQuery({
    queryKey: ['collections'],
    queryFn: fetchAllCollections,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export { useAllCollections };
