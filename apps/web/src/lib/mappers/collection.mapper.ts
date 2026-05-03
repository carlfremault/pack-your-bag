import type { CollectionCardProps, CollectionHeaderCardProps } from '@repo/react-common/card';
import { type ColorTheme } from '@repo/react-common/color-themes';

import { CollectionForDisplay, CollectionForHeaderDisplay } from '@/features/collection/types';

export function toCollectionCardProps(
  collection: CollectionForDisplay,
  linkAs?: React.ElementType,
  actionQuery?: string,
): CollectionCardProps {
  const basePath = `/${collection.type}/${collection.id}`;

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description ?? undefined,
    colorTheme: collection.colorTheme as ColorTheme,
    type: collection.type,
    totalWeight: collection.displayWeight,
    weightUnit: collection.displayUnit,
    itemCount: collection.itemCount,
    href: actionQuery ? `${basePath}?${actionQuery}` : basePath,
    linkAs,
  };
}

export function toCollectionHeaderCardProps(
  collection: CollectionForHeaderDisplay,
  isLoading: boolean,
  handlers: Pick<CollectionHeaderCardProps, 'onEditCollection' | 'onDeleteCollection'>,
): CollectionHeaderCardProps {
  return {
    id: collection.id,
    name: collection.name,
    description: collection.description ?? undefined,
    colorTheme: collection.colorTheme as ColorTheme,
    type: collection.type,
    totalWeight: collection.displayWeight,
    weightUnit: collection.displayUnit,
    itemCount: collection.itemCount,
    categoryWeights: collection.categoryWeights,
    isLoading,
    ...handlers,
  };
}
