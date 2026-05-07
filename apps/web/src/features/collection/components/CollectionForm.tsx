'use client';
import toast from 'react-hot-toast';
import { BsBackpack } from 'react-icons/bs';
import { MdOutlineFormatListBulleted } from 'react-icons/md';

import { DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH } from '@repo/constants';
import { type ColorTheme, colorThemes } from '@repo/react-common/color-themes';
import { Input, InputSelect, InputSelectOption, InputTextarea } from '@repo/react-common/input';
import { CategoryPill } from '@repo/react-common/pill';
import { FormNotReady } from '@repo/react-common/utils';

import { FormWrapper } from '@/components/FormWrapper';
import { useFormState } from '@/hooks/useFormState';

import { useCollection, useCreateCollection, useUpdateCollection } from '../queries';
import { CollectionDetail, CollectionType } from '../types';

export interface CollectionFormProps {
  collectionId?: string;
  collectionType?: CollectionType;
  onClose: () => void;
}

interface CollectionFormInnerProps {
  collection?: CollectionDetail;
  onClose: () => void;
}

type CollectionFieldErrors = {
  name?: string;
  description?: string;
  colorTheme?: string;
  type?: string;
};

const TYPE_OPTIONS: InputSelectOption<CollectionType>[] = [
  {
    value: 'list',
    label: (
      <div className="flex items-center gap-1">
        <MdOutlineFormatListBulleted className="h-4 w-4" aria-hidden="true" />
        <span>List</span>
      </div>
    ),
  },
  {
    value: 'pack',
    label: (
      <div className="flex items-center gap-1">
        <BsBackpack className="h-4 w-4" aria-hidden="true" />
        <span>Pack</span>
      </div>
    ),
  },
];

const getInitialFormValues = (collection?: CollectionDetail) => {
  return {
    name: collection?.name ?? '',
    description: collection?.description ?? '',
    colorTheme: collection?.colorTheme ?? '',
    type: collection?.type ?? '',
  };
};

const COLLECTION_FORM_FIELDS: (keyof CollectionFieldErrors)[] = [
  'name',
  'description',
  'colorTheme',
  'type',
];

function CollectionFormInner({ collection, onClose }: CollectionFormInnerProps) {
  const editMode = collection !== undefined;

  const { mutate: createCollection, isPending: isCreating } = useCreateCollection();
  const { mutate: updateCollection, isPending: isUpdating } = useUpdateCollection();

  const { formValues, fieldErrors, setFieldErrors, handleFieldChange, handleReset, handleError } =
    useFormState(getInitialFormValues(collection), COLLECTION_FORM_FIELDS);

  const colorThemeOptions = Object.entries(colorThemes).map(([key, config]) => ({
    label: <CategoryPill name={config.label} colorTheme={key as ColorTheme} />,
    value: key,
  }));

  const handleSuccess = () => {
    setFieldErrors({});
    if (editMode) {
      onClose();
    } else {
      handleReset();
    }
    toast.success(editMode ? 'Collection updated successfully' : 'Collection created successfully');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = formValues.name.trim();
    if (!trimmedName) {
      setFieldErrors((current) => ({ ...current, name: 'Name is required' }));
      return;
    }
    const type = formValues.type;
    if (type !== 'list' && type !== 'pack') {
      setFieldErrors((current) => ({ ...current, type: 'Please select a valid type' }));
      return;
    }

    const payload = {
      name: trimmedName,
      description: formValues.description,
      colorTheme: formValues.colorTheme,
    };

    if (editMode) {
      updateCollection(
        { id: collection.id, type, body: payload },
        { onSuccess: handleSuccess, onError: handleError },
      );
    } else {
      createCollection({ type, body: payload }, { onSuccess: handleSuccess, onError: handleError });
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
      {!editMode && (
        <InputSelect
          label="Type"
          required
          placeholder="Select a type"
          options={TYPE_OPTIONS}
          value={formValues.type}
          onChange={(value) => handleFieldChange('type', value)}
          errorMessage={fieldErrors.type}
        />
      )}
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
      <InputSelect
        label="Color"
        placeholder="Select a color"
        isClearable
        options={colorThemeOptions}
        value={formValues.colorTheme}
        onChange={(value) => handleFieldChange('colorTheme', value)}
        errorMessage={fieldErrors.colorTheme}
      />
    </FormWrapper>
  );
}

export default function CollectionForm({
  collectionId,
  collectionType,
  onClose,
}: CollectionFormProps) {
  const { data: collectionToEdit, isLoading } = useCollection(collectionId, collectionType);

  if (collectionId && isLoading && !collectionToEdit) {
    return <FormNotReady />;
  }

  return <CollectionFormInner collection={collectionToEdit} onClose={onClose} />;
}
