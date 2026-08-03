import { useMemo } from 'react';

import { CategoryPill } from '@repo/react-common/pill';
import { DataTable } from '@repo/react-common/table';
import { ExpandableText } from '@repo/react-common/utils';

import { createColumnHelper } from '@tanstack/react-table';

import { toCategoryPillProps } from '@/lib/mappers/category.mapper';

import { AssistantItemForDisplay } from '../types';

type GeneratedItemsTableProps<TData extends AssistantItemForDisplay> = {
  generatedItems: TData[];
  itemsActions: (item: AssistantItemForDisplay) => React.ReactNode;
};

export default function GeneratedItemsTable<TData extends AssistantItemForDisplay>(
  props: GeneratedItemsTableProps<TData>,
) {
  const { generatedItems, itemsActions } = props;

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<TData>();

    return [
      columnHelper.display({
        id: 'category',
        header: () => <div className="text-center">Category</div>,
        size: 80,
        minSize: 80,
        maxSize: 80,
        cell: ({ row }) =>
          row.original.category ? (
            <div className="flex items-center justify-center">
              <CategoryPill {...toCategoryPillProps(row.original.category)} />
            </div>
          ) : null,
      }),
      columnHelper.display({
        id: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div className="text-sm leading-normal wrap-break-word">{row.original.name}</div>
        ),
      }),
      columnHelper.display({
        id: 'notes',
        header: 'Notes',
        cell: ({ row }) => (row.original.note ? <ExpandableText text={row.original.note} /> : null),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-center">Quantity</div>,
        size: 80,
        minSize: 80,
        maxSize: 80,
        cell: ({ row }) => (
          <div className="flex w-full items-center justify-center">
            {itemsActions(row.original)}
          </div>
        ),
      }),
    ];
  }, [itemsActions]);

  return (
    <div className="bg-background h-full w-full">
      <DataTable data={generatedItems} columns={columns} scrollable />
    </div>
  );
}
