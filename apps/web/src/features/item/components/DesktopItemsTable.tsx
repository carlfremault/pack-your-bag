import { ReactNode, useMemo } from 'react';

import { Alert } from '@repo/react-common/alert';
import { CategoryPill } from '@repo/react-common/pill';
import { DataTable } from '@repo/react-common/table';

import { createColumnHelper } from '@tanstack/react-table';

import { toCategoryPillProps } from '@/lib/mappers/category.mapper';

import { Item } from '../types';

import DesktopItemsTableSkeleton from './DesktopItemsTableSkeleton';

export interface DesktopItemsTableProps {
  items: Item[];
  isFetching: boolean;
  errorMessage: string | null;
}

const columnHelper = createColumnHelper<Item>();

export default function DesktopItemsTable(props: DesktopItemsTableProps) {
  const { items, isFetching, errorMessage } = props;

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
          return <CategoryPill {...toCategoryPillProps(row.original.category)} />;
        },
      }),
    ],
    [],
  );

  let content: ReactNode;

  if (isFetching && !errorMessage) {
    content = <DesktopItemsTableSkeleton />;
  } else if (!isFetching && !errorMessage) {
    content = <DataTable data={items} columns={columns} emptyStateLabel="No items found" />;
  }

  return (
    <div className="bg-background w-full p-4">
      <div className="flex flex-col gap-4">
        {errorMessage && <Alert message={errorMessage} type="error" />}
        {content}
      </div>
    </div>
  );
}
