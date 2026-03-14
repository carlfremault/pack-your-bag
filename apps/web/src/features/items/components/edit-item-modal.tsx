import { Modal } from '@/components/ui/modals/modal';

import { useItem } from '../queries';

import ItemForm from './item-form';

interface EditItemModalProps {
  itemId: string;
}

export default function EditItemModal(props: EditItemModalProps) {
  const { itemId } = props;
  const { data: item } = useItem(itemId);

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
