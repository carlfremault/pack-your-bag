'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

import { Button, SubmitButton } from '@repo/react-common/button';
import { Input, TextareaInput } from '@repo/react-common/input';

import { ITEM_DESCRIPTION_MAX_LENGTH, ITEM_NAME_MAX_LENGTH } from '@/lib/constants';
import { extractErrorMessage } from '@/utils/extractApiErrorDetails';
import { getFieldErrorsFromHttpError } from '@/utils/getFieldErrors';

import { useCreateItem } from '../queries';
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
  categoryId: '',
});

const ITEM_FORM_FIELDS: (keyof ItemFieldErrors)[] = ['name', 'description', 'weight', 'categoryId'];

export default function ItemForm(props: ItemFormProps) {
  const { item } = props;

  const [formValues, setFormValues] = useState(getInitialFormValues(item));
  const [fieldErrors, setFieldErrors] = useState<ItemFieldErrors>({});
  const { mutate: createItem, isPending } = useCreateItem();
  const router = useRouter();

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
    toast.success('Item created successfully');
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

    const payload = {
      name: formValues.name,
      description: formValues.description,
      weight: formValues.weight ? Number(formValues.weight) : undefined,
      categoryId: formValues.categoryId || undefined,
    };

    createItem(payload, {
      onSuccess: handleSuccess,
      onError: (error) => {
        const itemFieldErrors = getFieldErrorsFromHttpError(error, ITEM_FORM_FIELDS);
        if (itemFieldErrors) {
          setFieldErrors(itemFieldErrors);
          return;
        }

        setFieldErrors({});
        toast.error(`Error: ${extractErrorMessage(error)}`);
      },
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit}>
        <fieldset
          disabled={isPending}
          className="flex flex-col gap-4 transition-opacity disabled:opacity-50"
        >
          <Input
            label="Name"
            name="name"
            required
            maxLength={ITEM_NAME_MAX_LENGTH}
            value={formValues.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            errorMessage={fieldErrors.name}
            className="rounded-md border border-gray-300 p-2"
          />
          <TextareaInput
            label="Description"
            name="description"
            rows={4}
            maxLength={ITEM_DESCRIPTION_MAX_LENGTH}
            value={formValues.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            errorMessage={fieldErrors.description}
            className="rounded-md border border-gray-300 p-2"
          />
          <Input
            label="Weight"
            name="weight"
            type="number"
            step="0.01"
            value={formValues.weight}
            onChange={(e) => handleFieldChange('weight', e.target.value)}
            errorMessage={fieldErrors.weight}
            className="rounded-md border border-gray-300 p-2"
          />

          <div className="flex flex-col items-center gap-2">
            <SubmitButton pending={isPending} className="w-full">
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
