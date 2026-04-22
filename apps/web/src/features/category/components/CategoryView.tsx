import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '@repo/react-common/button';

import { extractErrorMessage } from '@/utils/extractApiErrorDetails';

import { useAllCategories, useDeleteCategory } from '../queries';

import BackButton from './BackButton';
import { CategoryForm } from './CategoryForm';
import CategoryTable from './CategoryTable';
import DeleteCategoryModal from './DeleteCategoryModal';

export function CategoryView() {
  const [mode, setMode] = useState<'table' | 'form'>('table');
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const { data = [], isLoading } = useAllCategories();
  const editCategory = data.find((category) => category.id === categoryId);

  const { mutate: deleteCategory, isPending: isDeleting } = useDeleteCategory();
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const categoryToDelete = data.find((category) => category.id === deleteCategoryId) ?? null;

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

  const confirmDeleteCategory = useCallback(() => {
    if (!deleteCategoryId) return;
    deleteCategory(deleteCategoryId, {
      onSuccess: () => {
        closeDeleteModal();
        toast.success('Category deleted successfully');
      },
      onError: (error) => {
        toast.error(`Error: ${extractErrorMessage(error)}`);
      },
    });
  }, [deleteCategoryId, deleteCategory, closeDeleteModal]);

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
        {categoryToDelete && (
          <DeleteCategoryModal
            categoryId={categoryToDelete.id}
            isDeleting={isDeleting}
            onConfirm={confirmDeleteCategory}
            onClose={closeDeleteModal}
          />
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
