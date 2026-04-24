import { useCallback, useState } from 'react';

import { Button } from '@repo/react-common/button';

import { useAllCategories } from '../queries';

import { CategoryForm } from './CategoryForm';
import CategoryTable from './CategoryTable';
import DeleteCategoryModal from './DeleteCategoryModal';

interface CategoryViewProps {
  onClose: () => void;
  onTitleChange: (title: string) => void;
}

export function CategoryView({ onClose, onTitleChange }: CategoryViewProps) {
  const [mode, setMode] = useState<'table' | 'form'>('table');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  const { data = [], isLoading } = useAllCategories();
  const editCategory = data.find((category) => category.id === categoryId);

  const closeForm = useCallback(() => {
    setCategoryId(null);
    setMode('table');
    onTitleChange('Categories');
  }, [onTitleChange]);

  const handleAddCategory = () => {
    setCategoryId(null);
    setMode('form');
    onTitleChange('Add category');
  };

  const handleEditCategory = useCallback(
    (id: string) => {
      setCategoryId(id);
      setMode('form');
      onTitleChange('Edit category');
    },
    [onTitleChange],
  );

  const handleDeleteCategory = useCallback((id: string) => {
    setDeleteCategoryId(id);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteCategoryId(null);
  }, []);

  let content: React.ReactNode = null;
  if (mode === 'table') {
    content = (
      <>
        <CategoryTable
          categories={data}
          isLoading={isLoading}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
        />
        <Button className="w-full" onClick={handleAddCategory}>
          Add Category
        </Button>
        <div className="hidden lg:block">
          <Button variant="outline" onClick={onClose} className="w-full">
            Back
          </Button>
        </div>
        {deleteCategoryId && (
          <DeleteCategoryModal categoryId={deleteCategoryId} onClose={closeDeleteModal} />
        )}
      </>
    );
  } else if (mode === 'form') {
    content = <CategoryForm category={editCategory} onClose={closeForm} />;
  }

  return <div className="flex h-full max-h-[80vh] flex-col justify-center gap-4">{content}</div>;
}
