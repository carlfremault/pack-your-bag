'use client';

import { useMemo } from 'react';

import { CategoryPill } from '@repo/react-common/pill';
import { DataTable, DataTableActions } from '@repo/react-common/table';
import { ExpandableText } from '@repo/react-common/utils';

import { createColumnHelper } from '@tanstack/react-table';

import { toCategoryPillProps } from '@/lib/mappers/category.mapper';

import { Item } from '../types';

import DesktopItemsTableSkeleton from './DesktopItemsTableSkeleton';

export interface DesktopItemsTableProps {
  items: Item[];
  weightUnit?: string;
  isLoading: boolean;
  onEditItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
}

const columnHelper = createColumnHelper<Item>();

export default function DesktopItemsTable(props: DesktopItemsTableProps) {
  const { items, weightUnit, isLoading, onEditItem, onDeleteItem } = props;

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: ({ row }) => {
          return <div className="text-sm leading-normal wrap-break-word">{row.original.name}</div>;
        },
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        cell: ({ row }) => {
          return row.original.description ? (
            <ExpandableText text={row.original.description} />
          ) : null;
        },
      }),
      columnHelper.accessor('weight', {
        header: 'Weight',
        cell: ({ row }) => {
          return row.original.weight != null ? (
            <div className="text-sm leading-normal">
              {row.original.weight}
              {weightUnit ? ` ${weightUnit}` : ''}
            </div>
          ) : null;
        },
        size: 100,
        minSize: 100,
        maxSize: 100,
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
        header: () => <div className="text-center">Actions</div>,
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
    [onEditItem, onDeleteItem, weightUnit],
  );

  return (
    <div className="bg-background h-full w-full">
      {isLoading ? (
        <DesktopItemsTableSkeleton />
      ) : (
        <DataTable data={items} columns={columns} emptyStateLabel="No items found" scrollable />
      )}
    </div>
  );
}
