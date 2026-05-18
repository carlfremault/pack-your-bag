import { ColorTheme } from '@repo/react-common/color-themes';
import { CategoryPillProps } from '@repo/react-common/pill';

import {
  CollectionDetail,
  CollectionItemForDisplay,
  List,
  Pack,
} from '@/features/collection/types';
import { Item } from '@/features/item/types';
import { formatWeightForDisplay } from '@/utils/weightUtils';

export type CategoryWeightEntry = {
  category: { id: string; name: string; colorTheme: string };
  weight: number;
};

type ItemEntry = {
  quantity: number;
  item: {
    weight: number | null;
    category: { id: string; name: string; colorTheme: string } | null;
  };
};

const OTHER_CATEGORY = { id: '__other__', name: 'other', colorTheme: 'default' };

const accumulateCategoryWeights = (
  acc: Map<string, CategoryWeightEntry>,
  items: ItemEntry[],
  multiplier: number = 1,
): number => {
  let uncategorizedWeight = 0;
  items.forEach((entry) => {
    if (!entry.item.category) {
      uncategorizedWeight += (entry.item.weight ?? 0) * entry.quantity * multiplier;
      return;
    }
    const { category } = entry.item;
    const entryWeight = (entry.item.weight ?? 0) * entry.quantity * multiplier;
    const existing = acc.get(category.id);
    if (existing) {
      existing.weight += entryWeight;
    } else {
      acc.set(category.id, { category, weight: entryWeight });
    }
  });
  return uncategorizedWeight;
};

/**
 * Calculates the total weight per category of all items in a list
 */
export const getCategoryWeightsInList = (list: List): CategoryWeightEntry[] => {
  const acc = new Map<string, CategoryWeightEntry>();
  const uncategorizedWeight = accumulateCategoryWeights(acc, list.items ?? []);
  const result = Array.from(acc.values());
  if (uncategorizedWeight > 0)
    result.push({ category: OTHER_CATEGORY, weight: uncategorizedWeight });
  return result;
};

/**
 * Calculates the total weight per category of all items in a pack
 */
export const getCategoryWeightsInPack = (pack: Pack): CategoryWeightEntry[] => {
  const acc = new Map<string, CategoryWeightEntry>();
  let uncategorizedWeight = accumulateCategoryWeights(acc, pack.items ?? []);
  pack.lists?.forEach((listEntry) => {
    uncategorizedWeight += accumulateCategoryWeights(
      acc,
      listEntry.list.items ?? [],
      listEntry.quantity,
    );
  });
  const result = Array.from(acc.values());
  if (uncategorizedWeight > 0)
    result.push({ category: OTHER_CATEGORY, weight: uncategorizedWeight });
  return result;
};

/**
 * Calculates the total quantity of all items within a list,
 */
export const getTotalItemQuantityInList = (list: List): number => {
  return list.items?.reduce((total, entry) => total + entry.quantity, 0) ?? 0;
};

/**
 * Calculates the total quantity of all items within a pack,
 * including direct items and items nested within lists.
 */
export const getTotalItemQuantityInPack = (pack: Pack): number => {
  // 1. Total of items directly in pack
  const directItemsTotal = pack.items?.reduce((total, entry) => total + entry.quantity, 0) ?? 0;

  // 2. Total of items inside lists
  const listItemsTotal =
    pack.lists?.reduce((total, listEntry) => {
      const itemsInThisList = getTotalItemQuantityInList(listEntry.list);
      return total + itemsInThisList * listEntry.quantity;
    }, 0) ?? 0;

  return directItemsTotal + listItemsTotal;
};

/**
 * Calculates the total weight of all items within a list
 */
export const getTotalWeightInList = (list: List): number => {
  return (
    list.items?.reduce((total, entry) => {
      return total + (entry.item.weight ?? 0) * entry.quantity;
    }, 0) ?? 0
  );
};

/**
 * Calculates the total weight of all items within a pack
 * including direct items and items nested within lists.
 */
export const getTotalWeightInPack = (pack: Pack): number => {
  // 1. Weight of items directly in pack
  const directItemsWeight =
    pack.items?.reduce((total, entry) => {
      return total + (entry.item.weight ?? 0) * entry.quantity;
    }, 0) ?? 0;

  // 2. Weight of items inside lists
  const listItemsWeight =
    pack.lists?.reduce((total, listEntry) => {
      const weightOfOneList = getTotalWeightInList(listEntry.list);
      return total + weightOfOneList * listEntry.quantity;
    }, 0) ?? 0;

  return directItemsWeight + listItemsWeight;
};

/**
 * Converts an item in a collection to a format
 * that includes the display weight and unit.
 */
export const toCollectionItemForDisplay = (
  { quantity, item }: { quantity: number; item: Item },
  units?: string,
): CollectionItemForDisplay => {
  const { value, unit } =
    item.weight != null
      ? formatWeightForDisplay(Number(item.weight), units)
      : { value: null, unit: null };
  return { ...item, quantity, displayWeight: value, displayUnit: unit, type: 'item' as const };
};

/**
 * Get all different categories present in a collection.
 */
export const getAllCategoriesInCollection = (collection: CollectionDetail): CategoryPillProps[] => {
  const categoriesMap = new Map<string, CategoryPillProps>();

  collection.items?.forEach(({ item }) => {
    if (item.category) {
      categoriesMap.set(item.category.id, {
        name: item.category.name,
        colorTheme: item.category.colorTheme as ColorTheme,
      });
    }
  });
  if (collection.type === 'pack') {
    collection.lists?.forEach(({ list }) => {
      list.items?.forEach(({ item }) => {
        if (item.category) {
          categoriesMap.set(item.category.id, {
            name: item.category.name,
            colorTheme: item.category.colorTheme as ColorTheme,
          });
        }
      });
    });
  }
  return Array.from(categoriesMap.values());
};
