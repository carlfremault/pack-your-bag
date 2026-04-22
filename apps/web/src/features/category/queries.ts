import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';

import { toHttpError } from '@/utils/http-error';

import { Category, CategoryDeleteImpact, CreateCategoryBody, UpdateCategoryBody } from './types';

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

// -------------------------------
// Create category
// -------------------------------
const createCategory = async (body: CreateCategoryBody): Promise<Category> => {
  const res = await fetch('/api/category', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw await toHttpError(res);
  }
  const { data } = await res.json();
  return data;
};

const nextOptimisticId = () => `optimistic-${crypto.randomUUID()}`;

const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });

      const previousCategories = queryClient.getQueryData<Category[]>(['categories']) ?? [];

      const optimisticId = nextOptimisticId();
      const optimisticCategory: Category = {
        id: optimisticId,
        name: body.name,
        description: body.description ?? null,
        colorTheme: body.colorTheme ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      queryClient.setQueryData(['categories'], (old: Category[] = []) => [
        ...old,
        optimisticCategory,
      ]);

      return { previousCategories };
    },
    onError: (_error, _body, context) => {
      queryClient.setQueryData(['categories'], context?.previousCategories);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

// -------------------------------
// Update category
// -------------------------------
const updateCategory = async (id: string, body: UpdateCategoryBody): Promise<Category> => {
  const res = await fetch(`/api/category/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw await toHttpError(res);
  }
  const { data } = await res.json();
  return data;
};

const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCategoryBody }) =>
      updateCategory(id, body),
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });

      const previousCategories = queryClient.getQueryData<Category[]>(['categories']) ?? [];

      queryClient.setQueryData(['categories'], (old: Category[] = []) =>
        old.map((category) =>
          category.id === id
            ? { ...category, ...body, updatedAt: new Date().toISOString() }
            : category,
        ),
      );

      return { previousCategories };
    },
    onError: (_error, _body, context) => {
      queryClient.setQueryData(['categories'], context?.previousCategories);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};

// -------------------------------
// Get category delete impact
// -------------------------------
const fetchCategoryDeleteImpact = async (id: string): Promise<CategoryDeleteImpact> => {
  const res = await fetch(`/api/category/${id}/delete-impact`);

  if (!res.ok) {
    throw await toHttpError(res);
  }
  const { data } = await res.json();
  return data;
};

const useCategoryDeleteImpact = (id: string): UseQueryResult<CategoryDeleteImpact> => {
  return useQuery({
    queryKey: ['categoryDeleteImpact', id],
    queryFn: () => fetchCategoryDeleteImpact(id),
    enabled: !!id,
  });
};

// -------------------------------
// Delete category
// -------------------------------
const deleteCategory = async (id: string): Promise<void> => {
  const res = await fetch(`/api/category/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw await toHttpError(res);
  }
};

const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });

      const previousCategories = queryClient.getQueryData<Category[]>(['categories']) ?? [];

      queryClient.setQueryData(['categories'], (old: Category[] = []) =>
        old.filter((category) => category.id !== id),
      );

      return { previousCategories };
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(['categories'], context?.previousCategories);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};

export {
  useAllCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCategoryDeleteImpact,
};
