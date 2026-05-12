'use client';

import toast from 'react-hot-toast';

import { CATEGORY_NAME_MAX_LENGTH } from '@repo/constants';
import { type ColorTheme, colorThemes } from '@repo/react-common/color-themes';
import { Input, InputSelect } from '@repo/react-common/input';
import { CategoryPill } from '@repo/react-common/pill';

import { FormWrapper } from '@/components/FormWrapper';
import { useFormState } from '@/hooks/useFormState';

import { useCreateCategory, useUpdateCategory } from '../queries';
import { Category } from '../types';

export type CategoryFieldErrors = {
  name?: string;
  colorTheme?: string;
};

const CATEGORY_FORM_FIELDS: (keyof CategoryFieldErrors)[] = ['name', 'colorTheme'];

export interface CategoryFormProps {
  category?: Category;
  onClose: () => void;
  onCategoryRenamed: (oldName: string, newName: string) => void;
}

export function CategoryForm(props: CategoryFormProps) {
  const { category, onClose, onCategoryRenamed } = props;
  const editMode = category !== undefined;

  const { formValues, fieldErrors, setFieldErrors, handleFieldChange, handleReset, handleError } =
    useFormState(getInitialFormValues(category), CATEGORY_FORM_FIELDS);

  const { mutate: createCategory, isPending: isCreating } = useCreateCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory();

  const colorThemeOptions = Object.entries(colorThemes).map(([key, config]) => ({
    label: <CategoryPill name={config.label} colorTheme={key as ColorTheme} />,
    value: key,
  }));

  const handleSuccess = () => {
    setFieldErrors({});
    toast.success(editMode ? 'Category updated successfully' : 'Category created successfully');
    if (editMode && category && formValues.name !== category.name) {
      onCategoryRenamed(category.name, formValues.name);
    }
    if (editMode) {
      onClose();
    } else {
      handleReset();
    }
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
        { onSuccess: handleSuccess, onError: handleError },
      );
    } else {
      createCategory(payload, { onSuccess: handleSuccess, onError: handleError });
    }
  };

  return (
    <FormWrapper
      onSubmit={handleSubmit}
      onReset={handleReset}
      onClose={onClose}
      isPending={isCreating || isUpdating}
      editMode={editMode}
    >
      <Input
        label="Name"
        required
        maxLength={CATEGORY_NAME_MAX_LENGTH}
        value={formValues.name}
        onChange={(e) => handleFieldChange('name', e.target.value)}
        errorMessage={fieldErrors.name}
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
    </FormWrapper>
  );
}

function getInitialFormValues(category?: Category) {
  return {
    name: category?.name ?? '',
    colorTheme: category?.colorTheme ?? '',
  };
}
