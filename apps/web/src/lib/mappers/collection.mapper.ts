import type {
  CollectionCardProps,
  CollectionDetailsCardProps,
  CollectionListCardProps,
} from '@repo/react-common/card';
import { type ColorTheme } from '@repo/react-common/color-themes';

import { CollectionForDetailsCardDisplay, CollectionForDisplay } from '@/features/collection/types';

export function toCollectionCardProps(
  collection: CollectionForDisplay,
  linkAs?: React.ElementType,
): CollectionCardProps {
  return {
    id: collection.id,
    name: collection.name,
    description: collection.description ?? undefined,
    colorTheme: collection.colorTheme as ColorTheme,
    type: collection.type,
    totalWeight: collection.displayWeight,
    weightUnit: collection.displayUnit,
    itemCount: collection.itemCount,
    href: `/${collection.type}/${collection.id}`,
    linkAs,
  };
}

export function toCollectionDetailsCardProps(
  collection: CollectionForDetailsCardDisplay,
  handlers: Pick<CollectionDetailsCardProps, 'onEditCollection' | 'onDeleteCollection'>,
): CollectionDetailsCardProps {
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
    ...handlers,
  };
}

export function toCollectionListCardProps(
  collection: CollectionForDisplay,
  actions: React.ReactNode,
): CollectionListCardProps {
  return {
    name: collection.name,
    description: collection.description ?? undefined,
    colorTheme: collection.colorTheme as ColorTheme,
    itemCount: collection.itemCount,
    totalWeight: collection.displayWeight,
    weightUnit: collection.displayUnit,
    actions,
  };
}
