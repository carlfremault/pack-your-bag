import { useCallback, useState } from 'react';

import { Button } from '@repo/react-common/button';

import { useAllCategories } from '../queries';

import BackButton from './BackButton';
import { CategoryForm } from './CategoryForm';
import CategoryTable from './CategoryTable';
import DeleteCategoryModal from './DeleteCategoryModal';

export function CategoryView() {
  const [mode, setMode] = useState<'table' | 'form'>('table');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  const { data = [], isLoading } = useAllCategories();
  const editCategory = data.find((category) => category.id === categoryId);

  const closeForm = () => {
    setCategoryId(null);
    setMode('table');
  };

  const handleAddCategory = () => {
    setCategoryId(null);
    setMode('form');
  };

  const handleEditCategory = useCallback((id: string) => {
    setCategoryId(id);
    setMode('form');
  }, []);

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
        {deleteCategoryId && (
          <DeleteCategoryModal categoryId={deleteCategoryId} onClose={closeDeleteModal} />
        )}
      </>
    );
  } else if (mode === 'form') {
    content = (
      <>
        <h2 className="text-primary text-xl">{categoryId ? 'Edit Category' : 'Add Category'}</h2>
        <CategoryForm category={editCategory} onClose={closeForm} />
      </>
    );
  }

  return (
    <div className="flex h-full max-h-[80vh] flex-col justify-center gap-4">
      <BackButton />
      {content}
    </div>
  );
}
