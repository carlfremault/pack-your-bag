type ListForSummary = {
  items: Array<{ quantity: number; item: { weight: number | null } }>;
};

export function computeListItemCount(list: ListForSummary): number {
  return list.items.reduce((sum, { quantity }) => sum + quantity, 0);
}

export function computeListTotalWeight(list: ListForSummary): number {
  return list.items.reduce((sum, { quantity, item }) => sum + quantity * (item.weight ?? 0), 0);
}
