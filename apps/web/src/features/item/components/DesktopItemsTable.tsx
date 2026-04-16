import { useMemo } from 'react';

import { CategoryPill } from '@repo/react-common/pill';
import { DataTable } from '@repo/react-common/table';

import { createColumnHelper } from '@tanstack/react-table';

import { toCategoryPillProps } from '@/lib/mappers/category.mapper';

import { Item } from '../types';

import DesktopItemsTableSkeleton from './DesktopItemsTableSkeleton';

export interface DesktopItemsTableProps {
  items: Item[];
  isLoading: boolean;
}

const columnHelper = createColumnHelper<Item>();

export default function DesktopItemsTable(props: DesktopItemsTableProps) {
  const { items, isLoading } = props;

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
    ],
    [],
  );

  return (
    <div className="bg-background w-full p-4">
      {isLoading ? (
        <DesktopItemsTableSkeleton />
      ) : (
        <DataTable data={items} columns={columns} emptyStateLabel="No items found" />
      )}
    </div>
  );
}
