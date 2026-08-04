import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toHttpError } from '@/utils/http-error';

import { Collection, Pack } from '../collection/types';

import { CreateAssistantPackBody, GeneratedPackingList } from './types';

// --------------------------------
// Fetch AI Assistant Packing List
// --------------------------------

const fetchAIAssistantPackingList = async (
  payload: unknown,
): Promise<GeneratedPackingList | null> => {
  const res = await fetch('/api/assistant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw await toHttpError(res);
  }
  const { data } = await res.json();
  return data ?? null;
};

export const useAllAIAssistantPackingLists = () => {
  const response = useMutation({
    mutationFn: fetchAIAssistantPackingList,
  });

  return response;
};

// --------------------------------
// Create Generated Pack
// --------------------------------

const createGeneratedPack = async (body: CreateAssistantPackBody): Promise<Pack> => {
  const res = await fetch('/api/pack/assistant', {
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

const nextOptimisticCollectionId = () => `optimistic-${crypto.randomUUID()}`;

export const useCreateGeneratedPack = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGeneratedPack,
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: ['collections'] });

      const previousCollections = queryClient.getQueryData<Collection[]>(['collections']) ?? [];

      const optimisticId = nextOptimisticCollectionId();
      const optimisticCollection = {
        id: optimisticId,
        type: 'pack' as const,
        name: body.packName,
        description: null,
        colorTheme: null,
        itemCount: 0,
        totalWeight: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(['collections'], (old: Collection[] = []) => [
        ...old,
        optimisticCollection,
      ]);

      return { previousCollections, optimisticId };
    },
    onError: (_error, _body, context) => {
      if (context?.previousCollections !== undefined) {
        queryClient.setQueryData(['collections'], context.previousCollections);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['pack'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};
