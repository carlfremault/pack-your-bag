import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { toHttpError } from '@/utils/http-error';

import { Category } from './types';

// -------------------------------
// Fetch all Categories
// -------------------------------
const fetchAllCategories = async (): Promise<Category[]> => {
  const res = await fetch('/api/category');

  if (!res.ok) {
    throw await toHttpError(res);
  }
  const { data } = await res.json();
  return data;
};

const useAllCategories = (): UseQueryResult<Category[]> => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchAllCategories,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export { useAllCategories };
