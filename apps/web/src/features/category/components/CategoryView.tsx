import { useCallback, useState } from 'react';

import { Button } from '@repo/react-common/button';

import { useAllCategories } from '../queries';
import { Category } from '../types';

import CategoryDeleteModal from './CategoryDeleteModal';
import { CategoryForm } from './CategoryForm';
import CategoryTable from './CategoryTable';

export type CategoryViewMode = 'table' | 'add' | 'edit';

interface CategoryViewProps {
  onClose: () => void;
  onModeChange: (mode: CategoryViewMode) => void;
  onCategoryRenamed: (oldName: string, newName: string) => void;
  onCategoryDeleted: (name: string) => void;
}

export function CategoryView({
  onClose,
  onModeChange,
  onCategoryRenamed,
  onCategoryDeleted,
}: CategoryViewProps) {
  const [mode, setMode] = useState<'table' | 'form'>('table');
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);

  const { data } = useAllCategories();
  const sortedCategories = data.sort((a, b) => a.name.localeCompare(b.name));
  const editCategory = data.find((category) => category.id === editCategoryId);

  const closeForm = () => {
    setEditCategoryId(null);
    setMode('table');
    onModeChange('table');
  };

  const handleAddCategory = () => {
    setEditCategoryId(null);
    setMode('form');
    onModeChange('add');
  };

  const handleEditCategory = useCallback(
    (id: string) => {
      setEditCategoryId(id);
      setMode('form');
      onModeChange('edit');
    },
    [onModeChange],
  );

  const handleDeleteCategory = useCallback(
    (id: string) => {
      const category = sortedCategories.find((c) => c.id === id);
      if (category) setDeleteCategory(category);
    },
    [sortedCategories],
  );

  const handleCloseDeleteModal = () => {
    setDeleteCategory(null);
  };

  let content: React.ReactNode = null;
  if (mode === 'table') {
    content = (
      <>
        <div className="min-h-0 overflow-hidden">
          <CategoryTable
            categories={sortedCategories}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        </div>
        <Button className="w-full shrink-0" onClick={handleAddCategory}>
          Add Categories
        </Button>
        <div className="hidden shrink-0 lg:block">
          <Button variant="outline" onClick={onClose} className="w-full">
            Back
          </Button>
        </div>
        {deleteCategory && (
          <CategoryDeleteModal
            categoryId={deleteCategory.id}
            categoryName={deleteCategory.name}
            onClose={handleCloseDeleteModal}
            onCategoryDeleted={onCategoryDeleted}
          />
        )}
      </>
    );
  } else if (mode === 'form') {
    content = (
      <CategoryForm
        category={editCategory}
        onClose={closeForm}
        onCategoryRenamed={onCategoryRenamed}
      />
    );
  }

  return <div className="flex max-h-full min-h-0 flex-col gap-4">{content}</div>;
}
