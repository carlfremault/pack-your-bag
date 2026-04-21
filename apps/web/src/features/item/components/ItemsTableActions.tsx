import { MdDeleteOutline, MdOutlineEdit } from 'react-icons/md';

import { Button } from '@repo/react-common/button';

interface ItemsTableActionsProps {
  itemName: string;
  itemId: string;
  onEditItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
}

export default function ItemsTableActions(props: ItemsTableActionsProps) {
  const { itemName, itemId, onEditItem, onDeleteItem } = props;

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="unstyledIcon"
        color="primary"
        aria-label={`Edit ${itemName}`}
        onClick={() => onEditItem(itemId)}
      >
        <MdOutlineEdit className="h-5 w-5" />
      </Button>
      <Button
        variant="unstyledIcon"
        color="danger"
        aria-label={`Delete ${itemName}`}
        onClick={() => onDeleteItem(itemId)}
      >
        <MdDeleteOutline className="h-5 w-5" />
      </Button>
    </div>
  );
}
