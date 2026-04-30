import { List, Pack } from '@/features/collection/types';

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
