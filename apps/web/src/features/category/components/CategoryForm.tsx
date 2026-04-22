'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { Button, SubmitButton } from '@repo/react-common/button';
import { colorThemes } from '@repo/react-common/color-themes';
import { Input, InputSelect } from '@repo/react-common/input';
import { CategoryPill } from '@repo/react-common/pill';

import { CATEGORY_NAME_MAX_LENGTH } from '@/lib/constants';
import { extractErrorMessage } from '@/utils/extractApiErrorDetails';
import { getFieldErrorsFromHttpError } from '@/utils/getFieldErrors';

import { useCreateCategory, useUpdateCategory } from '../queries';
import { Category } from '../types';

export interface CategoryFormProps {
  category?: Category;
  onClose: () => void;
}

export type CategoryFieldErrors = {
  name?: string;
  colorTheme?: string;
};

const getInitialFormValues = (category?: Category) => ({
  name: category?.name ?? '',
  colorTheme: category?.colorTheme ?? '',
});

const CATEGORY_FORM_FIELDS: (keyof CategoryFieldErrors)[] = ['name', 'colorTheme'];

export function CategoryForm(props: CategoryFormProps) {
  const { category, onClose } = props;
  const editMode = category !== undefined;

  const [formValues, setFormValues] = useState(getInitialFormValues(category));
  const [fieldErrors, setFieldErrors] = useState<CategoryFieldErrors>({});
  const { mutate: createCategory, isPending: isCreating } = useCreateCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory();

  const colorThemeOptions = Object.entries(colorThemes).map(([key, config]) => ({
    label: <CategoryPill name={config.label} colorTheme={key} />,
    value: key,
  }));

  const handleSuccess = () => {
    setFieldErrors({});
    toast.success(editMode ? 'Category updated successfully' : 'Category created successfully');
    onClose();
  };

  const handleReset = () => {
    setFormValues(getInitialFormValues(category));
    setFieldErrors({});
  };

  const handleError = (error: Error) => {
    const categoryFieldErrors = getFieldErrorsFromHttpError(error, CATEGORY_FORM_FIELDS);
    if (categoryFieldErrors) {
      setFieldErrors(categoryFieldErrors);
      return;
    }

    setFieldErrors({});
    toast.error(`Error: ${extractErrorMessage(error)}`);
  };

  const clearFieldError = (fieldName: keyof CategoryFieldErrors) => {
    setFieldErrors((currentFieldErrors) => {
      if (!currentFieldErrors[fieldName]) {
        return currentFieldErrors;
      }

      return { ...currentFieldErrors, [fieldName]: undefined };
    });
  };

  const handleFieldChange = (fieldName: keyof CategoryFieldErrors, value: string) => {
    setFormValues((currentValues) => ({ ...currentValues, [fieldName]: value }));
    clearFieldError(fieldName);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = formValues.name.trim();
    const errors: CategoryFieldErrors = {
      ...(!trimmedName && { name: 'Name is required' }),
      ...(!formValues.colorTheme && { colorTheme: 'Color is required' }),
    };

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      name: trimmedName,
      colorTheme: formValues.colorTheme,
    };

    if (editMode) {
      updateCategory(
        { id: category.id, body: payload },
        {
          onSuccess: handleSuccess,
          onError: handleError,
        },
      );
    } else {
      createCategory(payload, {
        onSuccess: handleSuccess,
        onError: handleError,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset
        disabled={isCreating || isUpdating}
        className="flex flex-col gap-4 transition-opacity disabled:opacity-50"
      >
        <Input
          label="Name"
          required
          maxLength={CATEGORY_NAME_MAX_LENGTH}
          value={formValues.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          errorMessage={fieldErrors.name}
          className="rounded-md border border-gray-300 p-2"
        />
        <InputSelect
          label="Color"
          required
          placeholder="Select a color"
          options={colorThemeOptions}
          value={formValues.colorTheme}
          onChange={(value) => handleFieldChange('colorTheme', value)}
          errorMessage={fieldErrors.colorTheme}
        />
        <div className="flex flex-col items-center gap-2">
          <SubmitButton pending={isCreating || isUpdating} className="w-full">
            Save
          </SubmitButton>
          <div className="flex w-full items-center justify-between gap-2">
            <Button type="button" onClick={handleReset} variant="outline" className="w-full">
              Reset
            </Button>
            <Button type="button" onClick={onClose} variant="outline" className="w-full">
              Cancel
            </Button>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
