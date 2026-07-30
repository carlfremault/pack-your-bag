import { useMutation } from '@tanstack/react-query';

import { toHttpError } from '@/utils/http-error';

import { AssistantPackingList } from './types';

const fetchAIAssistantPackingList = async (
  payload: unknown,
): Promise<AssistantPackingList | null> => {
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
