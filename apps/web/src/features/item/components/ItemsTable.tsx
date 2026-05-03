'use client';

import React, { useMemo } from 'react';

import { CategoryPill } from '@repo/react-common/pill';
import { DataTable } from '@repo/react-common/table';
import { ExpandableText } from '@repo/react-common/utils';

import { createColumnHelper } from '@tanstack/react-table';

import { toCategoryPillProps } from '@/lib/mappers/category.mapper';

import { ItemForDisplay } from '../types';

import ItemsTableSkeleton from './ItemsTableSkeleton';

export interface ItemsTableProps<TData extends ItemForDisplay> {
  items: TData[];
  isLoading: boolean;
  actionsTitle?: string;
  actionSize?: number;
  itemsActions: (row: TData) => React.ReactNode;
}

export default function ItemsTable<TData extends ItemForDisplay>(props: ItemsTableProps<TData>) {
  const { items, isLoading, actionsTitle = 'Actions', actionSize = 80, itemsActions } = props;

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<TData>();

    return [
      columnHelper.display({
        id: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div className="text-sm leading-normal wrap-break-word">{row.original.name}</div>
        ),
      }),
      columnHelper.display({
        id: 'description',
        header: 'Description',
        cell: ({ row }) =>
          row.original.description ? <ExpandableText text={row.original.description} /> : null,
      }),
      columnHelper.display({
        id: 'weight',
        header: 'Weight',
        cell: ({ row }) => {
          const { displayWeight, displayUnit } = row.original;
          return displayWeight !== null ? (
            <div className="text-sm leading-normal">
              {displayWeight}
              {displayUnit ? ` ${displayUnit}` : ''}
            </div>
          ) : null;
        },
        size: 100,
        minSize: 100,
        maxSize: 100,
      }),
      columnHelper.display({
        id: 'category',
        header: 'Category',
        cell: ({ row }) =>
          row.original.category ? (
            <CategoryPill {...toCategoryPillProps(row.original.category)} />
          ) : null,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-center">{actionsTitle}</div>,
        size: actionSize,
        minSize: actionSize,
        maxSize: actionSize,
        cell: ({ row }) => (
          <div className="flex w-full items-center justify-center gap-4">
            {itemsActions(row.original)}
          </div>
        ),
      }),
    ];
  }, [actionSize, actionsTitle, itemsActions]);

  return (
    <div className="bg-background w-full">
      {isLoading ? (
        <ItemsTableSkeleton />
      ) : (
        <DataTable data={items} columns={columns} emptyStateLabel="No items found" scrollable />
      )}
    </div>
  );
}
