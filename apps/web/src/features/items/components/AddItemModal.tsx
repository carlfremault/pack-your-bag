import { Modal } from '@/components/ui/modals/modal';

import ItemForm from './ItemForm';

export default function AddItemModal() {
  return (
    <Modal.Root>
      <Modal.Trigger>Add Item</Modal.Trigger>
      <Modal.Content title="Add Item">{(close) => <ItemForm onSuccess={close} />}</Modal.Content>
    </Modal.Root>
  );
}
