import type { ItemCardProps } from '@repo/react-common/card';

import { Item } from '@/features/item/types';

export function toItemCardProps(
  item: Item,
  handlers: Pick<ItemCardProps, 'onEditItem' | 'onDeleteItem'>,
): ItemCardProps {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? undefined,
    weight: typeof item.weight === 'number' ? item.weight : undefined,
    category: item.category
      ? {
          name: item.category.name,
          colorTheme: item.category.colorCode,
        }
      : null,
    ...handlers,
  };
}
