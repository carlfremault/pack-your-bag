import type { RequestBody } from '@repo/product-client';

import z from 'zod';

import type { assistantFormSchema } from './schema';

export type CreateAssistantPackBody = RequestBody<'/pack/assistant', 'post'>;

export type AssistantFormType = z.infer<typeof assistantFormSchema>;

export type AssistantItem = {
  name: string;
  quantity: number;
  note?: string;
};

export type AssistantPackingCategory = {
  name: string;
  items: AssistantItem[];
};

export type GeneratedPackingList = {
  categories: AssistantPackingCategory[];
};

export type AssistantItemForDisplay = AssistantItem & {
  category: { name: string; colorTheme: string } | null;
};
