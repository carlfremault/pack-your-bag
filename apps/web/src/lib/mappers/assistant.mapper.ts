import { AssistantItemCardProps } from '@repo/react-common/card';
import { ColorTheme } from '@repo/react-common/color-themes';

import { AssistantItemForDisplay } from '@/features/assistant/types';

export function toAssistantItemCardProps(
  item: AssistantItemForDisplay,
  actions: React.ReactNode,
): AssistantItemCardProps {
  return {
    name: item.name,
    category: item.category
      ? {
          name: item.category.name,
          colorTheme: item.category.colorTheme as ColorTheme,
        }
      : null,
    note: item.note,
    actions,
  };
}
