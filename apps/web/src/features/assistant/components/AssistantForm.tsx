import { YesOrNo } from '@repo/constants';
import { Button, SubmitButton } from '@repo/react-common/button';
import {
  Input,
  InputDateRange,
  InputIconToggle,
  InputMultiSelect,
  InputSelect,
  InputTextarea,
} from '@repo/react-common/input';

import { useFormState } from '@/hooks/useFormState';

import {
  accomodationTypeOptions,
  activityOptions,
  comfortOptions,
  DESTINATION_MAX_LENGTH,
  laundryAccessOptions,
  luggageConstraintsOptions,
  REMARKS_MAX_LENGTH,
  transportationOptions,
} from '../constants';
import { useAllAIAssistantPackingLists } from '../queries';
import { AssistantPackingList } from '../types';

type AssistantFormErrors = {
  destination?: string;
  activity?: string[];
  comfort?: string;
  transportation?: string;
  accomodationType?: string;
  luggageConstraints?: string;
  laundryAccess?: string;
  dateFrom?: string;
  dateUntil?: string;
  nbPersons?: string;
  remarks?: string;
};

const ASSISTANT_FORM_FIELDS: (keyof AssistantFormErrors)[] = [
  'destination',
  'activity',
  'comfort',
  'transportation',
  'accomodationType',
  'luggageConstraints',
  'laundryAccess',
  'dateFrom',
  'dateUntil',
  'nbPersons',
  'remarks',
];

type AssistantFormProps = {
  setGeneratedPackingList: (value: AssistantPackingList | null) => void;
};

export default function AssistantForm(props: AssistantFormProps) {
  const { setGeneratedPackingList } = props;

  const { mutateAsync, isPending } = useAllAIAssistantPackingLists();

  const { formValues, fieldErrors, setFieldErrors, handleFieldChange, handleReset, handleError } =
    useFormState(getInitialFormValues(), ASSISTANT_FORM_FIELDS);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedDestination = formValues.destination.trim();
    if (!trimmedDestination) {
      setFieldErrors((current) => ({ ...current, destination: 'Destination is required' }));
      return;
    }
    const trimmedRemarks = formValues.remarks.trim();

    const payload = {
      destination: trimmedDestination,
      activity: formValues.activity,
      comfort: formValues.comfort,
      transportation: formValues.transportation,
      accomodationType: formValues.accomodationType,
      luggageConstraints: formValues.luggageConstraints,
      laundryAccess: formValues.laundryAccess,
      dateFrom: formValues.dateFrom,
      dateUntil: formValues.dateUntil,
      nbPersons: formValues.nbPersons,
      remarks: trimmedRemarks,
    };

    await mutateAsync(payload, {
      onSuccess: (data) => {
        setFieldErrors({});
        setGeneratedPackingList(data);
      },
      onError: handleError,
    });
  };

  const handleResetForm = () => {
    handleReset();
    setGeneratedPackingList(null);
  };

  return (
    <div className="bg-surface text-primary border-primary-ring w-full rounded-md border p-4 shadow-sm">
      <h2 className="mb-4 text-xl">AI packing assistant</h2>
      <p className="mb-4 text-sm leading-normal">
        Be as specific as possible for the best results.
      </p>
      <form onSubmit={handleSubmit}>
        <fieldset
          className="grid grid-cols-1 gap-4 transition-opacity disabled:opacity-50 sm:grid-cols-2"
          disabled={isPending}
        >
          <div className="sm:col-span-2">
            <Input
              label="Destination"
              type="text"
              required
              maxLength={DESTINATION_MAX_LENGTH}
              value={formValues.destination}
              onChange={(e) => handleFieldChange('destination', e.target.value)}
              errorMessage={fieldErrors.destination}
            />
          </div>
          <div className="sm:col-span-2">
            <InputDateRange
              dateFrom={formValues.dateFrom}
              dateUntil={formValues.dateUntil}
              onChange={(patch) => {
                if (patch.dateFrom !== undefined) handleFieldChange('dateFrom', patch.dateFrom);
                if (patch.dateUntil !== undefined) handleFieldChange('dateUntil', patch.dateUntil);
              }}
              grow
              className="md:flex-row"
            />
          </div>
          <InputMultiSelect
            label="Activity"
            options={activityOptions}
            value={formValues.activity}
            onChange={(value) => handleFieldChange('activity', value)}
            errorMessage={fieldErrors.activity}
            placeholder="Select activities"
          />
          <InputSelect
            label="Comfort level"
            options={comfortOptions}
            value={formValues.comfort}
            onChange={(value) => handleFieldChange('comfort', value)}
            errorMessage={fieldErrors.comfort}
            placeholder="Select comfort level"
          />
          <InputMultiSelect
            label="Transportation"
            options={transportationOptions}
            value={formValues.transportation}
            onChange={(value) => handleFieldChange('transportation', value)}
            errorMessage={fieldErrors.transportation}
            placeholder="Select transportation modes"
          />
          <InputMultiSelect
            label="Accomodation type"
            options={accomodationTypeOptions}
            value={formValues.accomodationType}
            onChange={(value) => handleFieldChange('accomodationType', value)}
            errorMessage={fieldErrors.accomodationType}
            placeholder="Select accomodation types"
          />
          <InputSelect
            label="Luggage constraints"
            options={luggageConstraintsOptions}
            value={formValues.luggageConstraints}
            onChange={(value) => handleFieldChange('luggageConstraints', value)}
            errorMessage={fieldErrors.luggageConstraints}
            placeholder="Select luggage constraints"
          />
          <div className="flex w-full min-w-0 items-end gap-4">
            <div className="min-w-0 flex-1">
              <Input
                label="Number of persons"
                type="number"
                value={formValues.nbPersons}
                onChange={(e) => handleFieldChange('nbPersons', e.target.value)}
                errorMessage={fieldErrors.nbPersons}
              />
            </div>
            <div className="shrink-0">
              <InputIconToggle
                label="Laundry access"
                options={laundryAccessOptions}
                value={formValues.laundryAccess}
                onChange={(value) => handleFieldChange('laundryAccess', value as YesOrNo)}
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <InputTextarea
              label="Remarks"
              rows={4}
              maxLength={REMARKS_MAX_LENGTH}
              value={formValues.remarks}
              onChange={(e) => handleFieldChange('remarks', e.target.value)}
              errorMessage={fieldErrors.remarks}
            />
          </div>
          <div className="flex w-full min-w-0 gap-4 sm:col-span-2">
            <Button type="button" onClick={handleResetForm} variant="outline" className="w-full">
              Reset
            </Button>
            <SubmitButton pending={isPending} className="w-full">
              Submit
            </SubmitButton>
          </div>
        </fieldset>
      </form>
    </div>
  );
}

function getInitialFormValues() {
  return {
    destination: '',
    activity: [] as string[],
    comfort: '',
    transportation: [] as string[],
    accomodationType: [] as string[],
    luggageConstraints: '',
    laundryAccess: YesOrNo.YES,
    dateFrom: '',
    dateUntil: '',
    nbPersons: '1',
    remarks: '',
  };
}
