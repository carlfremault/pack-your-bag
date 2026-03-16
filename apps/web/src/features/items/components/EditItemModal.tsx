import { Modal } from '@/components/ui/modals/modal';

import { Item } from '../types';

import ItemForm from './ItemForm';

interface EditItemModalProps {
  item: Item;
}

export default function EditItemModal(props: EditItemModalProps) {
  const { item } = props;

  return (
    <Modal.Root>
      <Modal.Trigger color="secondary" size="small">
        Edit
      </Modal.Trigger>
      <Modal.Content title="Edit Item">
        {(close) => <ItemForm item={item} onSuccess={close} />}
      </Modal.Content>
    </Modal.Root>
  );
}
