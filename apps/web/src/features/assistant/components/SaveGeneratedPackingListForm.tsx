import { NAME_MAX_LENGTH } from '@repo/constants';
import { Button, SubmitButton } from '@repo/react-common/button';
import { Input } from '@repo/react-common/input';

import { useFormState } from '@/hooks/useFormState';

import { AssistantPackingList } from '../types';

type SaveGeneratedPackingListFormErrors = {
  name: string;
};

const SAVE_GENERATED_PACKING_LIST_FORM_FIELDS: (keyof SaveGeneratedPackingListFormErrors)[] = [
  'name',
];

type SaveGeneratedPackingListFormProps = {
  packingList: AssistantPackingList;
  resetForm: () => void;
};

export default function SaveGeneratedPackingListForm(props: SaveGeneratedPackingListFormProps) {
  const { packingList, resetForm } = props;

  const isPending = false;

  const { formValues, fieldErrors, setFieldErrors, handleFieldChange, handleReset, handleError } =
    useFormState(getInitialFormValues(), SAVE_GENERATED_PACKING_LIST_FORM_FIELDS);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = formValues.name.trim();
    if (!trimmedName) {
      setFieldErrors((current) => ({ ...current, name: 'Name is required' }));
      return;
    }

    const payload = {
      name: trimmedName,
      packingList: packingList,
    };

    console.log('submit', payload);
    // TODO: save packing list, onSuccess callback to setFieldErrors({}) and redirect to the pack + show a toast ({ onSuccess: handleSuccess, onError: handleError },)
    // Also take care of hardcoded isPending state
  };

  const handleResetForm = () => {
    handleReset();
    resetForm();
  };

  return (
    <div className="bg-surface text-primary border-primary-ring flex w-full flex-col gap-4 rounded-md border p-4 shadow-sm">
      <h2 className="text-xl">AI packing assistant</h2>
      <div className="text-sm">
        <p>Baseline suggestions from a free AI model. Review before you trust it.</p>
        <p>Adjust quantities or remove items to fine-tune the list, then save as a pack.</p>
      </div>
      <form onSubmit={handleSubmit}>
        <fieldset
          className="grid grid-cols-1 gap-4 transition-opacity disabled:opacity-50 sm:grid-cols-2"
          disabled={isPending}
        >
          <div className="sm:col-span-2">
            <Input
              label="Pack name"
              type="text"
              maxLength={NAME_MAX_LENGTH}
              required
              value={formValues.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              errorMessage={fieldErrors.name}
            />
          </div>
          <div className="flex w-full min-w-0 gap-4 sm:col-span-2">
            <Button type="button" onClick={handleResetForm} variant="outline" className="w-full">
              Reset
            </Button>
            <SubmitButton pending={isPending} className="w-full">
              Save
            </SubmitButton>
          </div>
        </fieldset>
      </form>
    </div>
  );
}

function getInitialFormValues() {
  return {
    name: '',
  };
}
