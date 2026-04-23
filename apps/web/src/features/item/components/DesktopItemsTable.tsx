import { useMemo } from 'react';

import { CategoryPill } from '@repo/react-common/pill';
import { DataTable, DataTableActions } from '@repo/react-common/table';

import { createColumnHelper } from '@tanstack/react-table';

import { toCategoryPillProps } from '@/lib/mappers/category.mapper';

import { Item } from '../types';

import DesktopItemsTableSkeleton from './DesktopItemsTableSkeleton';

export interface DesktopItemsTableProps {
  items: Item[];
  isLoading: boolean;
  onEditItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
}

const columnHelper = createColumnHelper<Item>();

export default function DesktopItemsTable(props: DesktopItemsTableProps) {
  const { items, isLoading, onEditItem, onDeleteItem } = props;

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
      }),
      columnHelper.accessor('description', {
        header: 'Description',
      }),
      columnHelper.accessor('weight', {
        header: 'Weight',
      }),
      columnHelper.accessor('category', {
        header: 'Category',
        cell: ({ row }) => {
          return row.original.category ? (
            <CategoryPill {...toCategoryPillProps(row.original.category)} />
          ) : null;
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        size: 80,
        minSize: 80,
        maxSize: 80,
        cell: ({ row }) => {
          return (
            <DataTableActions
              rowName={row.original.name}
              rowId={row.original.id}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
            />
          );
        },
      }),
    ],
    [onEditItem, onDeleteItem],
  );

  return (
    <div className="bg-background w-full">
      {isLoading ? (
        <DesktopItemsTableSkeleton />
      ) : (
        <DataTable data={items} columns={columns} emptyStateLabel="No items found" />
      )}
    </div>
  );
}
