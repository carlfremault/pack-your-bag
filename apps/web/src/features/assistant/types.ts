import z from 'zod';

import { assistantFormSchema, assistantPackingListSchema } from './schema';

export type AssistantFormType = z.infer<typeof assistantFormSchema>;
export type AssistantPackingList = z.infer<typeof assistantPackingListSchema>;

export type AssistantItemForDisplay = {
  name: string;
  category: { name: string; colorTheme: string } | null;
  quantity: number;
  note?: string;
};
