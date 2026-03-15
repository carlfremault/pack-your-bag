'use client';

import { useMemo } from 'react';

import { createColumnHelper } from '@tanstack/react-table';

import ReactTable from '@/components/tables/react-table';
import Alert from '@/components/ui/alert';
import { useItems } from '@/features/items/queries';
import { extractErrorMessage } from '@/utils/extract-error-message';

import { Item } from '../types';

import AddItemModal from './AddItemModal';
import ItemsTableActions from './ItemsTableActions';
import ItemsTableHeader from './ItemsTableHeader';

const columnHelper = createColumnHelper<Item>();

export default function ItemsTable() {
  const { data = [], isFetching, isError, error, refetch } = useItems();

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
          return <div>{row.original.category?.name}</div>;
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        size: 50,
        minSize: 50,
        maxSize: 80,
        cell: ({ row }) => {
          return <ItemsTableActions itemId={row.original.id} />;
        },
      }),
    ],
    [],
  );

  if (isError && error)
    return <Alert className="m-4" message={`Error: ${extractErrorMessage(error)}`} />;

  return (
    <div className="w-full p-4">
      <div className="flex flex-col gap-4">
        <ItemsTableHeader nbItems={data.length} isFetching={isFetching} refetch={refetch} />
        <ReactTable data={data} columns={columns} />
        <AddItemModal />
      </div>
    </div>
  );
}
