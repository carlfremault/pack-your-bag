type PackForSummary = {
  items: Array<{ quantity: number; item: { weight: number | null } }>;
  lists: Array<{
    quantity: number;
    list: { items: Array<{ quantity: number; item: { weight: number | null } }> };
  }>;
};

export function computeItemCount(pack: PackForSummary): number {
  const directItems = pack.items.reduce((sum, { quantity }) => sum + quantity, 0);
  const listItems = pack.lists.reduce(
    (sum, { quantity: listQty, list }) =>
      sum + listQty * list.items.reduce((s, { quantity: itemQty }) => s + itemQty, 0),
    0,
  );
  return directItems + listItems;
}

export function computeTotalWeight(pack: PackForSummary): number {
  const directWeight = pack.items.reduce(
    (sum, { quantity, item }) => sum + quantity * (item.weight ?? 0),
    0,
  );
  const listWeight = pack.lists.reduce(
    (sum, { quantity: listQty, list }) =>
      sum +
      listQty *
        list.items.reduce((s, { quantity: itemQty, item }) => s + itemQty * (item.weight ?? 0), 0),
    0,
  );
  return directWeight + listWeight;
}
