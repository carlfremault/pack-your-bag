import ConfirmationDialog from '@/components/ui/dialogs/confirmation-dialog';
import { Modal } from '@/components/ui/modals/modal';

import { useDeleteItem } from '../queries';

interface DeleteItemModalProps {
  itemId: string;
}

export default function DeleteItemModal(props: DeleteItemModalProps) {
  const { itemId } = props;

  const { mutate: deleteItem } = useDeleteItem();

  return (
    <Modal.Root>
      <Modal.Trigger color="danger" size="small">
        Delete
      </Modal.Trigger>
      <Modal.Content title="Delete item">
        {(close) => (
          <ConfirmationDialog
            message="Are you sure you want to delete this item?"
            onConfirm={() => {
              deleteItem(itemId, {
                onSuccess: () => close(),
                onError: (error) => {
                  // TODO: Show error toast/notification
                },
              });
            }}
            onCancel={close}
          />
        )}
      </Modal.Content>
    </Modal.Root>
  );
}
