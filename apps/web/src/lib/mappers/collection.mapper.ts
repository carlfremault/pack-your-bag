import type { CollectionCardProps } from '@repo/react-common/card';
import { type ColorTheme } from '@repo/react-common/color-themes';

import { CollectionForDisplay } from '@/features/collection/types';

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
    numberOfItems: collection.numberOfItems,
    href: actionQuery ? `${basePath}?${actionQuery}` : basePath,
    linkAs,
  };
}
