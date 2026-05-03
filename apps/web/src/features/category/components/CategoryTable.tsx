import { useMemo } from 'react';

import { CategoryPill } from '@repo/react-common/pill';
import { DataTable, EditDeleteActions } from '@repo/react-common/table';

import { createColumnHelper } from '@tanstack/react-table';

import { toCategoryPillProps } from '@/lib/mappers/category.mapper';

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
          return <CategoryPill {...toCategoryPillProps(row.original)} />;
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
            <div className="flex items-center justify-center gap-4">
              <EditDeleteActions
                name={row.original.name}
                id={row.original.id}
                onEdit={onEditCategory}
                onDelete={onDeleteCategory}
              />
            </div>
          );
        },
      }),
    ],
    [onEditCategory, onDeleteCategory],
  );

  return isLoading ? (
    <CategoryTableSkeleton />
  ) : (
    <DataTable
      data={categories}
      columns={columns}
      emptyStateLabel="No categories found"
      scrollable
    />
  );
}
