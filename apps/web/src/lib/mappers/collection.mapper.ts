import type {
  CollectionCardProps,
  CollectionListCardProps,
  CollectionSummaryCardProps,
} from '@repo/react-common/card';
import { type ColorTheme } from '@repo/react-common/color-themes';

import { CollectionForDisplay, CollectionForSummaryDisplay } from '@/features/collection/types';

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

export function toCollectionSummaryCardProps(
  collection: CollectionForSummaryDisplay,
  handlers: Pick<CollectionSummaryCardProps, 'onEditCollection' | 'onDeleteCollection'>,
): CollectionSummaryCardProps {
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
