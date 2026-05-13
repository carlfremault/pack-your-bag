'use client';

import React, { useMemo } from 'react';
import { MdCheckCircleOutline, MdOutlineCircle } from 'react-icons/md';

import { CategoryPill } from '@repo/react-common/pill';
import { DataTable } from '@repo/react-common/table';

import { createColumnHelper } from '@tanstack/react-table';

import { toCategoryPillProps } from '@/lib/mappers/category.mapper';

import { TripItemForDisplay } from '../types';

export interface TripItemsTableProps<TData extends TripItemForDisplay> {
  items: TData[];
  actionsTitle?: string;
  actionSize?: number;
  itemsActions: (row: TData) => React.ReactNode;
}

export default function TripItemsTable<TData extends TripItemForDisplay>(
  props: TripItemsTableProps<TData>,
) {
  const { items, actionsTitle = 'Actions', actionSize = 80, itemsActions } = props;

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<TData>();

    return [
      columnHelper.display({
        id: 'fullyPacked',
        header: () => <div className="text-center">Ready</div>,
        size: 60,
        cell: ({ row }) => (
          <div className="flex w-full items-center justify-center">
            {row.original.quantity === row.original.packedQuantity ? (
              <>
                <MdCheckCircleOutline className="text-success h-5 w-5 shrink-0" aria-hidden />
                <span className="sr-only">Fully packed</span>
              </>
            ) : (
              <>
                <MdOutlineCircle className="h-5 w-5 shrink-0" aria-hidden />
                <span className="sr-only">Not fully packed</span>
              </>
            )}
          </div>
        ),
      }),
      columnHelper.display({
        id: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div className="text-sm leading-normal wrap-break-word">{row.original.name}</div>
        ),
      }),
      columnHelper.display({
        id: 'weight',
        header: () => <div className="text-center">Weight</div>,
        cell: ({ row }) => {
          const { displayWeight, displayUnit } = row.original;
          return displayWeight !== null ? (
            <div className="flex items-center justify-center text-sm leading-normal">
              {displayWeight}
              {displayUnit ? ` ${displayUnit}` : ''}
            </div>
          ) : null;
        },
        size: 80,
      }),
      columnHelper.display({
        id: 'category',
        header: () => <div className="text-center">Category</div>,
        cell: ({ row }) =>
          row.original.category ? (
            <div className="flex items-center justify-center">
              <CategoryPill {...toCategoryPillProps(row.original.category)} />
            </div>
          ) : null,
      }),
      columnHelper.display({
        id: 'quantity',
        header: () => <div className="text-center">Quantity</div>,
        size: 80,
        cell: ({ row }) => (
          <div className="flex items-center justify-center text-xs font-bold">{`${row.original.packedQuantity} / ${row.original.quantity}`}</div>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-center">{actionsTitle}</div>,
        size: actionSize,
        minSize: actionSize,
        maxSize: actionSize,
        cell: ({ row }) => (
          <div className="flex w-full items-center justify-center">
            {itemsActions(row.original)}
          </div>
        ),
      }),
    ];
  }, [actionSize, actionsTitle, itemsActions]);

  return (
    <div className="bg-background h-full w-full">
      <DataTable data={items} columns={columns} emptyStateLabel="No items found" scrollable />
    </div>
  );
}
