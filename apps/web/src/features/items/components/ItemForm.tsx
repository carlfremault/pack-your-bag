import { useRef } from 'react';

import Alert from '@/components/ui/alert';
import Button from '@/components/ui/buttons/button';
import Spinner from '@/components/ui/spinner';
import { extractErrorMessage } from '@/utils/extract-error-message';

import { useCreateItem, useUpdateItem } from '../queries';
import { Item } from '../types';

interface ItemFormProps {
  item?: Item;
  onSuccess: () => void;
}

export default function ItemForm(props: ItemFormProps) {
  const { item, onSuccess } = props;

  const formRef = useRef<HTMLFormElement>(null);

  const {
    mutate: createItem,
    isPending: isCreating,
    isSuccess: isCreated,
    error: createError,
  } = useCreateItem();
  const {
    mutate: updateItem,
    isPending: isUpdating,
    isSuccess: isUpdated,
    error: updateError,
  } = useUpdateItem();

  const handleReset = () => {
    formRef.current?.reset();
  };

  const handleMutationSuccess = () => {
    onSuccess();
    handleReset();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      weight: formData.get('weight') ? Number(formData.get('weight')) : undefined,
      categoryId: (formData.get('categoryId') as string) || undefined,
    };

    if (item) {
      updateItem(
        { id: item.id, body: payload },
        {
          onSuccess: handleMutationSuccess,
        },
      );
    } else {
      createItem(payload, {
        onSuccess: handleMutationSuccess,
      });
    }
  };

  const isPending = isCreating || isUpdating;
  const isSuccess = isCreated || isUpdated;
  const error = createError || updateError;
  const buttonText = item ? 'Update' : 'Create';

  return (
    <div className="flex flex-col gap-2">
      {error && <Alert message={`Error: ${extractErrorMessage(error)}`} />}

      <form onSubmit={handleSubmit} ref={formRef}>
        <fieldset
          disabled={isPending}
          className="flex flex-col gap-2 transition-opacity disabled:opacity-50"
        >
          <input
            name="name"
            placeholder="Name"
            className="rounded-md border border-gray-300 p-2"
            defaultValue={item?.name || undefined}
          />
          <input
            name="description"
            placeholder="Description"
            className="rounded-md border border-gray-300 p-2"
            defaultValue={item?.description || undefined}
          />
          <input
            name="weight"
            type="number"
            step="0.01"
            placeholder="Weight"
            className="rounded-md border border-gray-300 p-2"
            defaultValue={item?.weight ?? undefined}
          />
          <input
            name="categoryId"
            placeholder="Category"
            className="rounded-md border border-gray-300 p-2"
          />
          <div className="flex items-center justify-end gap-2">
            <Button type="submit" disabled={isPending || isSuccess}>
              <span className="flex w-16 items-center justify-center">
                {isPending ? <Spinner /> : buttonText}
              </span>
            </Button>
            <Button type="button" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
