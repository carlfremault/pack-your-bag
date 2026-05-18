import type { ColorTheme } from '@repo/react-common/color-themes';
import type { CategoryPillProps } from '@repo/react-common/pill';

import type { List, Pack } from '@/features/collection/types';

import type { TripForDetailsCardDisplay } from './types';

type CategoryItemEntry = TripForDetailsCardDisplay['categoryItems'][number];

type ItemEntry = {
  item: {
    id: string;
    name: string;
    weight: number | null;
    category: { id: string; name: string; colorTheme: string } | null;
  };
  quantity: number;
  packedQuantity?: number;
};

const OTHER_CATEGORY: CategoryPillProps = { name: 'other' };

/**
 * Accumulates the total quantity of items and packed items
 * for a given category.
 *
 * Due to API data structure, each item coming in carries the same packedQuantity value
 * (coming from the TripItemStatus table).
 * Therefore only the first packedQuantity value is used (countedPackedIds Set).
 */
const accumulateCategoryItems = (
  acc: Map<string, CategoryItemEntry>,
  items: ItemEntry[],
  multiplier: number = 1,
  countedPackedIds: Set<string>,
): { itemsNeeded: number; itemsPacked: number } => {
  let uncategorizedItemsNeeded = 0;
  let uncategorizedItemsPacked = 0;

  items.forEach((entry) => {
    const itemsNeeded = entry.quantity * multiplier;
    const itemsPacked = countedPackedIds.has(entry.item.id) ? 0 : (entry.packedQuantity ?? 0);
    countedPackedIds.add(entry.item.id);

    if (!entry.item.category) {
      uncategorizedItemsNeeded += itemsNeeded;
      uncategorizedItemsPacked += itemsPacked;
      return;
    }

    const { category } = entry.item;
    const existing = acc.get(category.id);
    if (existing) {
      existing.itemsNeeded += itemsNeeded;
      existing.itemsPacked += itemsPacked;
    } else {
      acc.set(category.id, {
        category: { name: category.name, colorTheme: category.colorTheme as ColorTheme },
        itemsNeeded,
        itemsPacked,
      });
    }
  });

  return { itemsNeeded: uncategorizedItemsNeeded, itemsPacked: uncategorizedItemsPacked };
};

/*
 * Calculates the total quantity of needed and packed
 * items in a pack, grouped by category.
 */
export const getCategoryItemsInPack = (pack: Pack): TripForDetailsCardDisplay['categoryItems'] => {
  const acc = new Map<string, CategoryItemEntry>();
  const countedPackedIds = new Set<string>();
  let uncategorizedItemsNeeded = 0;
  let uncategorizedItemsPacked = 0;

  const directUncategorized = accumulateCategoryItems(acc, pack.items ?? [], 1, countedPackedIds);
  uncategorizedItemsNeeded += directUncategorized.itemsNeeded;
  uncategorizedItemsPacked += directUncategorized.itemsPacked;

  pack.lists?.forEach((listEntry) => {
    const { itemsNeeded, itemsPacked } = accumulateCategoryItems(
      acc,
      listEntry.list.items ?? [],
      listEntry.quantity,
      countedPackedIds,
    );
    uncategorizedItemsNeeded += itemsNeeded;
    uncategorizedItemsPacked += itemsPacked;
  });

  const result = Array.from(acc.values());
  if (uncategorizedItemsNeeded > 0) {
    result.push({
      category: OTHER_CATEGORY,
      itemsNeeded: uncategorizedItemsNeeded,
      itemsPacked: uncategorizedItemsPacked,
    });
  }
  return result;
};

/*
 * Accumulates the total quantity of items and packed items for an array of items.
 *
 * Due to API data structure, each item coming in carries the same packedQuantity value
 * (coming from the TripItemStatus table).
 * Therefore only the first packedQuantity value is used (countedItemIds Set).
 * */
const accumulateItemQuantities = (
  acc: Map<string, ItemEntry>,
  items: ItemEntry[],
  multiplier: number = 1,
  countedItemIds: Set<string>,
): void => {
  items.forEach((entry) => {
    const itemsNeeded = entry.quantity * multiplier;
    const itemsPacked = countedItemIds.has(entry.item.id) ? 0 : (entry.packedQuantity ?? 0);
    countedItemIds.add(entry.item.id);

    const existing = acc.get(entry.item.id);
    if (existing) {
      acc.set(entry.item.id, {
        ...existing,
        quantity: existing.quantity + itemsNeeded,
        packedQuantity: (existing.packedQuantity ?? 0) + itemsPacked,
      });
    } else {
      acc.set(entry.item.id, {
        item: entry.item,
        quantity: itemsNeeded,
        packedQuantity: itemsPacked,
      });
    }
  });
};

/*
 * Calculates the total quantity of items and packed items for a given pack.
 * */
export const getItemQuantitiesInPack = (pack: Pack): ItemEntry[] => {
  const acc = new Map<string, ItemEntry>();
  const countedItemIds = new Set<string>();

  accumulateItemQuantities(acc, pack.items ?? [], 1, countedItemIds);

  pack.lists?.forEach((listEntry) => {
    accumulateItemQuantities(acc, listEntry.list.items ?? [], listEntry.quantity, countedItemIds);
  });

  return Array.from(acc.values());
};

/**
 * Calculates the total quantity of all packed items within a list.
 */
export const getTotalPackedItemQuantityInList = (list: List): number => {
  return list.items?.reduce((total, entry) => total + (entry.packedQuantity || 0), 0) ?? 0;
};

/**
 * Calculates the total packed quantity across a pack,
 * counting each item's packedQuantity exactly once regardless of
 * how many times it appears (directly or across multiple lists).
 *
 * Due to API data structure, each item coming in carries the same packedQuantity value
 * (coming from the TripItemStatus table).
 * Therefore only the last packedQuantity value is used (Map.set())
 */
export const getTotalPackedItemQuantityInPack = (pack: Pack): number => {
  const packedByItemId = new Map<string, number>();

  pack.items?.forEach((entry) => {
    packedByItemId.set(entry.item.id, entry.packedQuantity ?? 0);
  });

  pack.lists?.forEach((listEntry) => {
    listEntry.list.items?.forEach((entry) => {
      packedByItemId.set(entry.item.id, entry.packedQuantity ?? 0);
    });
  });

  return Array.from(packedByItemId.values()).reduce((sum, qty) => sum + qty, 0);
};

/*
 * Formats a trip date ISODateString to a given format.
 */
export function formatTripDate(isoDate: string, format: string): string {
  const [year, month, day] = isoDate.substring(0, 10).split('-');
  if (!year || !month || !day) return isoDate;
  return format.replace('YYYY', year).replace('MM', month).replace('DD', day);
}
