'use client';

import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

import { NAME_MAX_LENGTH } from '@repo/constants';
import { Button, SubmitButton } from '@repo/react-common/button';
import { Input } from '@repo/react-common/input';

import { Modal } from '@/components/Modal';
import { CloneModalTitle } from '@/components/Modal/ModalTitle';
import { useFormState } from '@/hooks/useFormState';
import { capitalizeFirstLetter } from '@/utils/capitalizeFirstLetter';

import { useCloneCollection, useCollection } from '../queries';
import { CollectionDetail, CollectionType } from '../types';

type CloneCollectionFieldErrors = {
  newName?: string;
};
const CLONE_COLLECTION_FORM_FIELDS: (keyof CloneCollectionFieldErrors)[] = ['newName'];

export interface CollectionCloneModalProps {
  collectionId: string;
  collectionType: CollectionType;
  onClose: () => void;
}

export default function CollectionCloneModal(props: CollectionCloneModalProps) {
  const { collectionId, collectionType, onClose } = props;

  const router = useRouter();

  const { data: collection } = useCollection(collectionId, collectionType);
  const { mutate: cloneCollection, isPending: isCloning } = useCloneCollection();

  const { formValues, fieldErrors, setFieldErrors, handleFieldChange, handleError } = useFormState(
    getInitialFormValues(collection),
    CLONE_COLLECTION_FORM_FIELDS,
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = formValues.newName.trim();
    if (!trimmedName) {
      setFieldErrors((current) => ({ ...current, newName: 'Name is required' }));
      return;
    }

    cloneCollection(
      {
        id: collection.id,
        type: collectionType,
        body: {
          newName: trimmedName,
        },
      },
      {
        onSuccess: () => {
          onClose();
          router.replace('/collections');
          toast.success(`${capitalizeFirstLetter(collectionType)} cloned successfully`);
        },
        onError: handleError,
      },
    );
  };

  return (
    <Modal.Root open onOpenChange={onClose}>
      <Modal.Content
        title={<CloneModalTitle label={`Clone ${collectionType}`} />}
        ariaDescribedBy="confirmation-dialog-desc"
      >
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4">
          <Input
            label="Name"
            required
            maxLength={NAME_MAX_LENGTH}
            value={formValues.newName}
            onChange={(e) => handleFieldChange('newName', e.target.value)}
            errorMessage={fieldErrors.newName}
            disabled={isCloning}
          />
          <div className="flex items-center gap-2 lg:justify-end">
            <Button
              variant="outline"
              color="primary"
              type="button"
              onClick={onClose}
              disabled={isCloning}
              className="w-full lg:w-auto"
            >
              Cancel
            </Button>
            <SubmitButton color="primary" pending={isCloning} className="w-full lg:w-auto">
              Clone
            </SubmitButton>
          </div>
        </form>
      </Modal.Content>
    </Modal.Root>
  );
}

function getInitialFormValues(collection?: CollectionDetail) {
  return {
    newName: (collection?.name ?? '') + ' (copy)',
  };
}
