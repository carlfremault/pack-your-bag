import type { ItemCardProps } from '@repo/react-common/card';
import { type ColorTheme } from '@repo/react-common/color-themes';

import { ItemForDisplay } from '@/features/item/types';

export function toItemCardProps(
  item: ItemForDisplay,
  handlers: Pick<ItemCardProps, 'onEditItem' | 'onDeleteItem'>,
): ItemCardProps {
  return {
    id: item.id,
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
    ...handlers,
  };
}
