'use client';

import { useMemo } from 'react';
import { MdOutlineRemoveRedEye, MdRemoveRedEye } from 'react-icons/md';

import { CategoryPill } from '@repo/react-common/pill';
import { DataTable } from '@repo/react-common/table';
import { ExpandableText } from '@repo/react-common/utils';

import { createColumnHelper } from '@tanstack/react-table';

import ItemsTableSkeleton from '@/features/item/components/ItemsTableSkeleton';
import { toCategoryPillProps } from '@/lib/mappers/category.mapper';

import { CollectionItemForDisplay, CollectionListForDisplayWithItems } from '../types';

export type PackContentEntry =
  | (CollectionItemForDisplay & { entryType: 'item' })
  | (CollectionListForDisplayWithItems & { entryType: 'list' });

export interface PackContentTableProps {
  entries: PackContentEntry[];
  isLoading: boolean;
  itemsActions: (
    row: CollectionItemForDisplay | CollectionListForDisplayWithItems,
  ) => React.ReactNode;
}

export default function PackContentTable(props: PackContentTableProps) {
  const { entries, isLoading, itemsActions } = props;

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<PackContentEntry>();

    return [
      columnHelper.display({
        id: 'type',
        header: 'Type',
        size: 60,
        cell: ({ row }) => {
          if (row.depth > 0) return null;
          return (
            <span className="text-primary bg-surface-overlay rounded px-1.5 py-0.5 text-xs font-medium capitalize">
              {row.original.entryType}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'name',
        header: 'Name',
        size: 100,
        cell: ({ row }) => (
          <div
            className="text-sm leading-normal wrap-break-word"
            style={row.depth > 0 ? { paddingLeft: '1.5rem' } : undefined}
          >
            {row.original.name}
          </div>
        ),
      }),
      columnHelper.display({
        id: 'description',
        header: 'Description',
        size: 100,
        cell: ({ row }) =>
          row.original.description ? <ExpandableText text={row.original.description} /> : null,
      }),
      columnHelper.display({
        id: 'weight',
        header: 'Weight',
        size: 80,
        cell: ({ row }) => {
          const { displayWeight, displayUnit } = row.original;
          return displayWeight != null && displayWeight !== '' ? (
            <div className="text-sm leading-normal">
              {displayWeight}
              {displayUnit ? ` ${displayUnit}` : ''}
            </div>
          ) : null;
        },
      }),
      columnHelper.display({
        id: 'category',
        header: 'Category',
        size: 80,
        cell: ({ row }) => {
          if (row.original.entryType !== 'item') return null;
          return row.original.category ? (
            <CategoryPill {...toCategoryPillProps(row.original.category)} />
          ) : null;
        },
      }),
      columnHelper.display({
        id: 'viewDetails',
        header: () => <div className="text-center">Details</div>,
        size: 60,
        cell: ({ row }) => {
          if (row.depth > 0 || row.original.entryType !== 'list') return null;
          return (
            <div className="flex w-full items-center justify-center">
              <button
                type="button"
                aria-label={`${row.getIsExpanded() ? 'Hide' : 'Show'} items in ${row.original.name}`}
                aria-expanded={row.getIsExpanded()}
                onClick={row.getToggleExpandedHandler()}
                className="focus-visible:ring-primary-ring text-primary rounded-md p-1 focus-visible:ring-2 focus-visible:outline-none"
              >
                {row.getIsExpanded() ? (
                  <MdRemoveRedEye className="h-5 w-5 cursor-pointer" aria-hidden="true" />
                ) : (
                  <MdOutlineRemoveRedEye className="h-5 w-5 cursor-pointer" aria-hidden="true" />
                )}
              </button>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'quantity',
        header: () => <div className="text-center">Quantity</div>,
        size: 120,
        cell: ({ row }) => (
          <div className="flex w-full items-center justify-center">
            {itemsActions(row.original)}
          </div>
        ),
      }),
    ];
  }, [itemsActions]);

  const getSubRows = useMemo(
    () =>
      (row: PackContentEntry): PackContentEntry[] | undefined => {
        if (row.entryType !== 'list') return undefined;
        return row.listItems.map((item): PackContentEntry => ({ ...item, entryType: 'item' }));
      },
    [],
  );

  if (isLoading) {
    return (
      <div className="bg-background w-full">
        <ItemsTableSkeleton />
      </div>
    );
  }

  return (
    <div className="bg-background w-full">
      <DataTable
        data={entries}
        columns={columns}
        getSubRows={getSubRows}
        getRowId={(row) => `${row.entryType}-${row.id}`}
        emptyStateLabel="No content found"
        scrollable
      />
    </div>
  );
}
