import { useCallback, useState } from 'react';

import { Button } from '@repo/react-common/button';

import { useAllCategories } from '../queries';

import BackButton from './BackButton';
import { CategoryForm } from './CategoryForm';
import CategoryTable from './CategoryTable';

export function CategoryView() {
  const [mode, setMode] = useState<'table' | 'form'>('table');
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const { data = [], isLoading } = useAllCategories();
  const editCategory = data.find((category) => category.id === categoryId);

  const handleAddCategory = () => {
    setCategoryId(null);
    setMode('form');
  };

  const handleEditCategory = useCallback((id: string) => {
    setCategoryId(id);
    setMode('form');
  }, []);

  const closeForm = () => {
    setCategoryId(null);
    setMode('table');
  };

  const categoryViewClassName = 'flex h-full max-h-[80vh] flex-col justify-center gap-4';

  if (mode === 'table') {
    return (
      <div className={categoryViewClassName}>
        <BackButton />
        <CategoryTable
          categories={data}
          isLoading={isLoading}
          onEditCategory={handleEditCategory}
          onDeleteCategory={(id) => {}}
        />
        <Button className="w-full" onClick={handleAddCategory}>
          Add Category
        </Button>
      </div>
    );
  }

  if (mode === 'form') {
    return (
      <div className={categoryViewClassName}>
        <BackButton />
        <h2 className="text-primary text-xl">{categoryId ? 'Edit Category' : 'Add Category'}</h2>
        <CategoryForm category={editCategory} onClose={closeForm} />
      </div>
    );
  }

  return null;
}
