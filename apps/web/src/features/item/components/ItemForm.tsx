'use client';

import toast from 'react-hot-toast';

import { DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH, Units } from '@repo/constants';
import { Input, InputSelect, InputTextarea } from '@repo/react-common/input';
import { CategoryPill } from '@repo/react-common/pill';
import { FormNotReady } from '@repo/react-common/utils';

import { FormWrapper } from '@/components/FormWrapper';
import { useAllCategories } from '@/features/category/queries';
import { useFormState } from '@/hooks/useFormState';
import { toCategoryPillProps } from '@/lib/mappers/category.mapper';
import { convertGramsToOunces, convertOuncesToGrams } from '@/utils/weightUtils';

import { useAllItems, useCreateItem, useUpdateItem } from '../queries';
import { Item } from '../types';

export interface ItemFormProps {
  itemId?: string;
  units: Units;
  onClose: () => void;
}

interface ItemFormInnerProps {
  item?: Item;
  units: Units;
  onClose: () => void;
}

type ItemFieldErrors = {
  name?: string;
  description?: string;
  weight?: string;
  categoryId?: string;
};

const getInitialFormValues = (item?: Item, units?: Units) => {
  const convertedWeight =
    units === Units.IMPERIAL && item?.weight
      ? convertGramsToOunces(Number(item?.weight))
      : item?.weight;

  return {
    name: item?.name ?? '',
    description: item?.description ?? '',
    weight: convertedWeight?.toString() ?? '',
    categoryId: item?.category?.id ?? '',
  };
};

const ITEM_FORM_FIELDS: (keyof ItemFieldErrors)[] = ['name', 'description', 'weight', 'categoryId'];

function ItemFormInner({ item, units, onClose }: ItemFormInnerProps) {
  const editMode = item !== undefined;

  const { mutate: createItem, isPending: isCreating } = useCreateItem();
  const { mutate: updateItem, isPending: isUpdating } = useUpdateItem();

  const { data: categories } = useAllCategories();
  const categoryOptions =
    categories?.map((category) => ({
      label: <CategoryPill {...toCategoryPillProps(category)} />,
      value: category.id,
    })) ?? [];

  const { formValues, fieldErrors, setFieldErrors, handleFieldChange, handleReset, handleError } =
    useFormState(getInitialFormValues(item, units), ITEM_FORM_FIELDS);

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

    const parsedWeight =
      units === Units.METRIC
        ? Number(formValues.weight)
        : convertOuncesToGrams(Number(formValues.weight));

    const payload = {
      name: trimmedName,
      description: formValues.description,
      weight: formValues.weight ? parsedWeight : editMode ? null : undefined,
      categoryId: formValues.categoryId ? formValues.categoryId : editMode ? null : undefined,
    };

    if (editMode) {
      updateItem(
        { id: item.id, body: payload },
        { onSuccess: handleSuccess, onError: handleError },
      );
    } else {
      createItem(payload, { onSuccess: handleSuccess, onError: handleError });
    }
  };

  return (
    <FormWrapper
      onSubmit={handleSubmit}
      onReset={handleReset}
      onClose={onClose}
      isPending={isCreating || isUpdating}
    >
      <Input
        label="Name"
        required
        maxLength={NAME_MAX_LENGTH}
        value={formValues.name}
        onChange={(e) => handleFieldChange('name', e.target.value)}
        errorMessage={fieldErrors.name}
      />
      <InputTextarea
        label="Description"
        rows={4}
        maxLength={DESCRIPTION_MAX_LENGTH}
        value={formValues.description}
        onChange={(e) => handleFieldChange('description', e.target.value)}
        errorMessage={fieldErrors.description}
      />
      <Input
        label={`Weight (${units === Units.METRIC ? 'in grams' : 'in ounces'})`}
        type="number"
        step="0.01"
        value={formValues.weight}
        onChange={(e) => handleFieldChange('weight', e.target.value)}
        errorMessage={fieldErrors.weight}
      />
      <InputSelect
        label="Category"
        isClearable
        placeholder={categories?.length === 0 ? 'No categories yet' : 'Select a category'}
        disabled={!!categories && categories.length === 0}
        options={categoryOptions}
        value={formValues.categoryId}
        onChange={(value) => handleFieldChange('categoryId', value)}
        errorMessage={fieldErrors.categoryId}
      />
    </FormWrapper>
  );
}

export default function ItemForm({ itemId, units, onClose }: ItemFormProps) {
  const { data: items = [], isLoading } = useAllItems();
  const itemToEdit = itemId ? items.find((i) => i.id === itemId) : undefined;

  if (itemId && isLoading && !itemToEdit) {
    return <FormNotReady />;
  }

  return <ItemFormInner item={itemToEdit} units={units} onClose={onClose} />;
}
