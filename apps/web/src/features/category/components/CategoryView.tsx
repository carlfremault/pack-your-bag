import { useCallback, useState } from 'react';

import { Alert } from '@repo/react-common/alert';
import { Button } from '@repo/react-common/button';

import { useAllCategories } from '../queries';
import { Category } from '../types';

import CategoryDeleteModal from './CategoryDeleteModal';
import { CategoryForm } from './CategoryForm';
import CategoryTable from './CategoryTable';

interface CategoryViewProps {
  onClose: () => void;
  onTitleChange: (title: string) => void;
  onCategoryRenamed: (oldName: string, newName: string) => void;
  onCategoryDeleted: (name: string) => void;
}

export function CategoryView({
  onClose,
  onTitleChange,
  onCategoryRenamed,
  onCategoryDeleted,
}: CategoryViewProps) {
  const [mode, setMode] = useState<'table' | 'form'>('table');
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);

  const { data = [], isLoading, isError } = useAllCategories();
  const editCategory = data.find((category) => category.id === editCategoryId);

  const closeForm = useCallback(() => {
    setEditCategoryId(null);
    setMode('table');
    onTitleChange('Categories');
  }, [onTitleChange]);

  const handleAddCategory = () => {
    setEditCategoryId(null);
    setMode('form');
    onTitleChange('Add category');
  };

  const handleEditCategory = useCallback(
    (id: string) => {
      setEditCategoryId(id);
      setMode('form');
      onTitleChange('Edit category');
    },
    [onTitleChange],
  );

  const handleDeleteCategory = useCallback(
    (id: string) => {
      const category = data.find((c) => c.id === id);
      if (category) setDeleteCategory(category);
    },
    [data],
  );

  const closeDeleteModal = useCallback(() => {
    setDeleteCategory(null);
  }, []);

  if (isError && !data.length) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Alert type="error" message="Failed to load categories. Please try again later." />
      </div>
    );
  }

  let content: React.ReactNode = null;
  if (mode === 'table') {
    content = (
      <>
        <div className="min-h-0 overflow-hidden">
          <CategoryTable
            categories={data}
            isLoading={isLoading}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        </div>
        <Button className="w-full shrink-0" onClick={handleAddCategory}>
          Add Category
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
            onClose={closeDeleteModal}
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
