import type { ItemCardProps } from '@repo/react-common/card';
import { type ColorTheme } from '@repo/react-common/color-themes';

import { Item } from '@/features/item/types';

export function toItemCardProps(
  item: Item,
  handlers: Pick<ItemCardProps, 'onEditItem' | 'onDeleteItem'>,
  weightUnit?: string,
): ItemCardProps {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? undefined,
    weight: typeof item.weight === 'number' ? item.weight : undefined,
    weightUnit,
    category: item.category
      ? {
          name: item.category.name,
          colorTheme: item.category.colorTheme as ColorTheme,
        }
      : null,
    ...handlers,
  };
}
