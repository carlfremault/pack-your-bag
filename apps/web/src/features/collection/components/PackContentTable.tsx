'use client';

import { useMemo } from 'react';
import { MdOutlineRemoveRedEye, MdRemoveRedEye } from 'react-icons/md';

import { CategoryPill } from '@repo/react-common/pill';
import { DataTable } from '@repo/react-common/table';
import { ExpandableText } from '@repo/react-common/utils';

import { createColumnHelper } from '@tanstack/react-table';

import { toCategoryPillProps } from '@/lib/mappers/category.mapper';

import {
  CollectionItemForDisplay,
  CollectionListForDisplayWithItems,
  PackContentRow,
} from '../types';

export interface PackContentTableProps {
  entries: PackContentRow[];
  upsertActions: (
    row: CollectionItemForDisplay | CollectionListForDisplayWithItems,
  ) => React.ReactNode;
  listItemUpsertActions: (item: CollectionItemForDisplay, listId: string) => React.ReactNode;
}

export default function PackContentTable(props: PackContentTableProps) {
  const { entries, upsertActions, listItemUpsertActions } = props;

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<PackContentRow>();

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
        cell: ({ row }) => {
          const content =
            row.depth > 0
              ? listItemUpsertActions(
                  row.original as CollectionItemForDisplay,
                  row.getParentRow()!.original.id,
                )
              : upsertActions(row.original);
          return <div className="flex w-full items-center justify-center">{content}</div>;
        },
      }),
    ];
  }, [upsertActions, listItemUpsertActions]);

  const getSubRows = useMemo(
    () =>
      (row: PackContentRow): PackContentRow[] | undefined => {
        if (row.entryType !== 'list') return undefined;
        return [...row.listItems]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((item): PackContentRow => ({ ...item, entryType: 'item' }));
      },
    [],
  );

  return (
    <div className="bg-background h-full w-full flex-1">
      <DataTable
        data={entries}
        columns={columns}
        getSubRows={getSubRows}
        getRowId={(row, _index, parent) =>
          parent ? `${parent.id}_${row.entryType}-${row.id}` : `${row.entryType}-${row.id}`
        }
        emptyStateLabel="No content found"
        scrollable
      />
    </div>
  );
}
