import { useMemo } from 'react';

import { CategoryPill } from '@repo/react-common/pill';
import { DataTable, DataTableActions } from '@repo/react-common/table';
import { Tooltip } from '@repo/react-common/tooltip';

import { createColumnHelper } from '@tanstack/react-table';

import { Category } from '../types';

import { CategoryTableSkeleton } from './CategoryTableSkeleton';

export interface CategoryTableProps {
  categories: Category[];
  isLoading: boolean;
  onEditCategory: (id: string) => void;
  onDeleteCategory: (id: string) => void;
}

const columnHelper = createColumnHelper<Category>();

export default function CategoryTable(props: CategoryTableProps) {
  const { categories, isLoading, onEditCategory, onDeleteCategory } = props;

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Category',
        cell: ({ row }) => {
          return (
            <Tooltip text={row.original.name}>
              <CategoryPill name={row.original.name} colorTheme={row.original.colorTheme} />
            </Tooltip>
          );
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
              onEdit={onEditCategory}
              onDelete={onDeleteCategory}
            />
          );
        },
      }),
    ],
    [onEditCategory, onDeleteCategory],
  );

  return isLoading ? (
    <CategoryTableSkeleton />
  ) : (
    <DataTable data={categories} columns={columns} emptyStateLabel="No categories found" />
  );
}
