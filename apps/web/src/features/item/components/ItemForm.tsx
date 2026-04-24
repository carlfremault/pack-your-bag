'use client';

import toast from 'react-hot-toast';

import { Input, InputSelect, InputTextarea } from '@repo/react-common/input';
import { CategoryPill } from '@repo/react-common/pill';
import { Spinner } from '@repo/react-common/spinner';

import { FormWrapper } from '@/components/FormWrapper';
import { useAllCategories } from '@/features/category/queries';
import { useFormState } from '@/hooks/useFormState';
import { ITEM_DESCRIPTION_MAX_LENGTH, ITEM_NAME_MAX_LENGTH } from '@/lib/constants';

import { useAllItems, useCreateItem, useUpdateItem } from '../queries';
import { Item } from '../types';

export interface ItemFormProps {
  itemId?: string;
  onClose: () => void;
}

export type ItemFieldErrors = {
  name?: string;
  description?: string;
  weight?: string;
  categoryId?: string;
};

const getInitialFormValues = (item?: Item) => ({
  name: item?.name ?? '',
  description: item?.description ?? '',
  weight: item?.weight?.toString() ?? '',
  categoryId: item?.category?.id ?? '',
});

const ITEM_FORM_FIELDS: (keyof ItemFieldErrors)[] = ['name', 'description', 'weight', 'categoryId'];

export default function ItemForm(props: ItemFormProps) {
  const { itemId, onClose } = props;
  const editMode = itemId !== undefined;

  const { data: items = [], isLoading: isItemsLoading } = useAllItems();
  const itemToEdit: Item | undefined = itemId ? items.find((i) => i.id === itemId) : undefined;

  const { mutate: createItem, isPending: isCreating } = useCreateItem();
  const { mutate: updateItem, isPending: isUpdating } = useUpdateItem();

  const { data: categories } = useAllCategories();
  const categoryOptions =
    categories?.map((category) => ({
      label: <CategoryPill name={category.name} colorTheme={category.colorTheme} />,
      value: category.id,
    })) ?? [];

  const { formValues, fieldErrors, setFieldErrors, handleFieldChange, handleReset, handleError } =
    useFormState(getInitialFormValues(itemToEdit), ITEM_FORM_FIELDS);

  const handleSuccess = () => {
    setFieldErrors({});
    onClose();
    toast.success(editMode ? 'Item updated successfully' : 'Item created successfully');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = formValues.name.trim();
    if (!trimmedName) {
      setFieldErrors((current) => ({ ...current, name: 'Name is required' }));
      return;
    }

    const payload = {
      name: trimmedName,
      description: formValues.description,
      weight: formValues.weight ? Number(formValues.weight) : editMode ? null : undefined,
      categoryId: formValues.categoryId ? formValues.categoryId : editMode ? null : undefined,
    };

    if (editMode) {
      if (!itemToEdit) return;
      updateItem(
        { id: itemToEdit.id, body: payload },
        { onSuccess: handleSuccess, onError: handleError },
      );
    } else {
      createItem(payload, { onSuccess: handleSuccess, onError: handleError });
    }
  };

  if (editMode && isItemsLoading && !itemToEdit) {
    return <Spinner size="small" />;
  }

  return (
    <div className="flex flex-col gap-2">
      <FormWrapper
        onSubmit={handleSubmit}
        onReset={handleReset}
        onClose={onClose}
        isPending={isCreating || isUpdating}
      >
        <Input
          label="Name"
          required
          maxLength={ITEM_NAME_MAX_LENGTH}
          value={formValues.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          errorMessage={fieldErrors.name}
          className="rounded-md border border-gray-300 p-2"
        />
        <InputTextarea
          label="Description"
          rows={4}
          maxLength={ITEM_DESCRIPTION_MAX_LENGTH}
          value={formValues.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          errorMessage={fieldErrors.description}
          className="rounded-md border border-gray-300 p-2"
        />
        <Input
          label="Weight"
          type="number"
          step="0.01"
          value={formValues.weight}
          onChange={(e) => handleFieldChange('weight', e.target.value)}
          errorMessage={fieldErrors.weight}
          className="rounded-md border border-gray-300 p-2"
        />
        <InputSelect
          label="Category"
          isClearable
          placeholder="Select a category"
          options={categoryOptions}
          value={formValues.categoryId}
          onChange={(value) => handleFieldChange('categoryId', value)}
          errorMessage={fieldErrors.categoryId}
        />
      </FormWrapper>
    </div>
  );
}
