import type { ItemCardProps } from '@repo/react-common/card';
import { type ColorTheme } from '@repo/react-common/color-themes';

import { ItemForDisplay } from '@/features/item/types';

export function toItemCardProps(item: ItemForDisplay, actions: React.ReactNode): ItemCardProps {
  return {
    name: item.name,
    description: item.description ?? undefined,
    weight: item.displayWeight ?? undefined,
    weightUnit: item.displayUnit ?? undefined,
    category: item.category
      ? {
          name: item.category.name,
          colorTheme: item.category.colorTheme as ColorTheme,
        }
      : null,
    actions,
  };
}
