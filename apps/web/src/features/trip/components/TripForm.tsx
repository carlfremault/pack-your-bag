import { Suspense, useMemo } from 'react';
import toast from 'react-hot-toast';

import { NAME_MAX_LENGTH, REMARKS_MAX_LENGTH } from '@repo/constants';
import { Input, InputSelect, InputTextarea } from '@repo/react-common/input';
import { CenteredSpinner } from '@repo/react-common/spinner';
import { getColorThemeClassName } from '@repo/react-common/utilities';
import { FormNotReady } from '@repo/react-common/utils';

import classNames from 'classnames';

import { FormWrapper } from '@/components/FormWrapper';
import { useAllPacks } from '@/features/collection/queries';
import { CollectionForDisplay } from '@/features/collection/types';
import { usePreferences } from '@/features/settings/queries';
import { useFormState } from '@/hooks/useFormState';
import { formatWeightForDisplay } from '@/utils/weightUtils';

import { useCreateTrip, useTrip, useUpdateTrip } from '../queries';
import { Trip } from '../types';
import { formatTripDate } from '../utils';

type TripFieldErrors = {
  name?: string;
  date?: string;
  remarks?: string;
  packId?: string;
};

const TRIP_FORM_FIELDS: (keyof TripFieldErrors)[] = ['name', 'date', 'remarks', 'packId'];

export interface TripFormProps {
  tripId?: string;
  onClose: () => void;
}
export default function TripForm(props: TripFormProps) {
  const { tripId, onClose } = props;

  if (tripId) {
    return (
      <Suspense fallback={<FormNotReady />}>
        <TripFormFetcher tripId={tripId} onClose={onClose} />
      </Suspense>
    );
  }

  return <TripFormInner trip={undefined} onClose={onClose} />;
}

interface TripFormFetcherProps {
  tripId: string;
  onClose: () => void;
}
function TripFormFetcher(props: TripFormFetcherProps) {
  const { tripId, onClose } = props;
  const { data: tripToEdit } = useTrip(tripId);

  return <TripFormInner trip={tripToEdit} onClose={onClose} />;
}

interface TripFormInnerProps {
  trip?: Trip;
  onClose: () => void;
}

function TripFormInner({ trip, onClose }: TripFormInnerProps) {
  const editMode = trip !== undefined;

  const { mutate: createTrip, isPending: isCreating } = useCreateTrip();
  const { mutate: updateTrip, isPending: isUpdating } = useUpdateTrip();

  const { formValues, fieldErrors, setFieldErrors, handleFieldChange, handleReset, handleError } =
    useFormState(getInitialFormValues(trip), TRIP_FORM_FIELDS);

  const handleSuccess = () => {
    setFieldErrors({});
    if (editMode) {
      onClose();
    } else {
      handleReset();
    }
    toast.success(editMode ? 'Trip updated successfully' : 'Trip created successfully');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = formValues.name.trim();
    if (!trimmedName) {
      setFieldErrors((current) => ({ ...current, name: 'Name is required' }));
      return;
    }

    const isoDate = formValues.date ? `${formValues.date}T00:00:00.000Z` : null;

    const payload = {
      name: trimmedName,
      remarks: formValues.remarks,
      date: isoDate ?? undefined,
      packId: formValues.packId || null,
    };

    if (editMode) {
      updateTrip(
        { id: trip.id, body: payload },
        { onSuccess: handleSuccess, onError: handleError },
      );
    } else {
      createTrip(payload, { onSuccess: handleSuccess, onError: handleError });
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
        maxLength={NAME_MAX_LENGTH}
        value={formValues.name}
        onChange={(e) => handleFieldChange('name', e.target.value)}
        errorMessage={fieldErrors.name}
      />
      <Input
        label="Date"
        type="date"
        value={formValues.date}
        onChange={(e) => handleFieldChange('date', e.target.value)}
        errorMessage={fieldErrors.date}
      />
      <Suspense fallback={<CenteredSpinner />}>
        <PackSelectField
          value={formValues.packId}
          onChange={(value) => handleFieldChange('packId', value)}
          errorMessage={fieldErrors.packId}
        />
      </Suspense>
      <InputTextarea
        label="Remarks"
        rows={4}
        maxLength={REMARKS_MAX_LENGTH}
        value={formValues.remarks}
        onChange={(e) => handleFieldChange('remarks', e.target.value)}
        errorMessage={fieldErrors.remarks}
      />
    </FormWrapper>
  );
}

interface PackSelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  errorMessage?: string;
}

function PackSelectField({ value, onChange, errorMessage }: PackSelectFieldProps) {
  const { data: packs } = useAllPacks();
  const { data: preferences } = usePreferences();

  const packsForDisplay = useMemo((): CollectionForDisplay[] => {
    return packs.map((pack) => {
      const { value, unit } = formatWeightForDisplay(pack.totalWeight, preferences?.units);
      return { ...pack, displayWeight: value, displayUnit: unit, type: 'pack' };
    });
  }, [packs, preferences?.units]);

  const packOptions = useMemo(() => {
    return packsForDisplay.map((pack) => {
      const colorThemeClassName = getColorThemeClassName(pack.colorTheme);
      return {
        label: (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={classNames('h-4 w-4 rounded-full border', colorThemeClassName)} />
              {pack.name}
            </div>
            <div className="flex items-center gap-1">
              {pack.displayWeight}
              {pack.displayUnit}
            </div>
          </div>
        ),
        value: pack.id,
      };
    });
  }, [packsForDisplay]);

  return (
    <InputSelect
      label="Pack"
      isClearable
      placeholder={packOptions.length === 0 ? 'No packs yet' : 'Select a pack'}
      disabled={packOptions.length === 0}
      options={packOptions}
      value={value}
      onChange={onChange}
      errorMessage={errorMessage}
    />
  );
}

function getInitialFormValues(trip?: Trip) {
  const date = trip?.date ? formatTripDate(trip.date, 'YYYY-MM-DD') : '';

  return {
    name: trip?.name ?? '',
    remarks: trip?.remarks ?? '',
    date,
    packId: trip?.pack?.id ?? '',
  };
}
