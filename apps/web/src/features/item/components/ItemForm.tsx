'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

import { Button, SubmitButton } from '@repo/react-common/button';
import { Input, InputSelect, InputTextarea } from '@repo/react-common/input';
import { CategoryPill } from '@repo/react-common/pill';

import { useAllCategories } from '@/features/category/queries';
import { ITEM_DESCRIPTION_MAX_LENGTH, ITEM_NAME_MAX_LENGTH } from '@/lib/constants';
import { extractErrorMessage } from '@/utils/extractApiErrorDetails';
import { getFieldErrorsFromHttpError } from '@/utils/getFieldErrors';

import { useCreateItem, useUpdateItem } from '../queries';
import { Item } from '../types';

export interface ItemFormProps {
  item?: Item;
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
  const { item } = props;
  const editMode = item !== undefined;

  const router = useRouter();
  const [formValues, setFormValues] = useState(getInitialFormValues(item));
  const [fieldErrors, setFieldErrors] = useState<ItemFieldErrors>({});
  const { mutate: createItem, isPending: isCreating } = useCreateItem();
  const { mutate: updateItem, isPending: isUpdating } = useUpdateItem();

  const { data: categories } = useAllCategories();
  const categoryOptions =
    categories?.map((category) => ({
      label: <CategoryPill name={category.name} colorTheme={category.colorTheme} />,
      value: category.id,
    })) ?? [];

  const handleReset = () => {
    setFormValues(getInitialFormValues(item));
    setFieldErrors({});
  };

  const closeForm = () => {
    router.replace('/items');
  };

  const handleSuccess = () => {
    setFieldErrors({});
    closeForm();
    toast.success(editMode ? 'Item updated successfully' : 'Item created successfully');
  };

  const handleError = (error: Error) => {
    const itemFieldErrors = getFieldErrorsFromHttpError(error, ITEM_FORM_FIELDS);
    if (itemFieldErrors) {
      setFieldErrors(itemFieldErrors);
      return;
    }

    setFieldErrors({});
    toast.error(`Error: ${extractErrorMessage(error)}`);
  };

  const clearFieldError = (fieldName: keyof ItemFieldErrors) => {
    setFieldErrors((currentFieldErrors) => {
      if (!currentFieldErrors[fieldName]) {
        return currentFieldErrors;
      }

      return { ...currentFieldErrors, [fieldName]: undefined };
    });
  };

  const handleFieldChange = (fieldName: keyof ItemFieldErrors, value: string) => {
    setFormValues((currentValues) => ({ ...currentValues, [fieldName]: value }));
    clearFieldError(fieldName);
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
      updateItem(
        { id: item.id, body: payload },
        {
          onSuccess: handleSuccess,
          onError: handleError,
        },
      );
    } else {
      createItem(payload, {
        onSuccess: handleSuccess,
        onError: handleError,
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit}>
        <fieldset
          disabled={isCreating || isUpdating}
          className="flex flex-col gap-4 transition-opacity disabled:opacity-50"
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
            placeholder="Select a category"
            options={categoryOptions}
            value={formValues.categoryId}
            onChange={(value) => handleFieldChange('categoryId', value)}
            errorMessage={fieldErrors.categoryId}
          />
          <div className="flex flex-col items-center gap-2">
            <SubmitButton pending={isCreating || isUpdating} className="w-full">
              Save
            </SubmitButton>
            <div className="flex w-full items-center justify-between gap-2">
              <Button type="button" onClick={handleReset} variant="outline" className="w-full">
                Reset
              </Button>
              <Button type="button" onClick={closeForm} variant="outline" className="w-full">
                Cancel
              </Button>
            </div>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
