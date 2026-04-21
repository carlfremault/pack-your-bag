import { MdDeleteOutline, MdOutlineEdit } from 'react-icons/md';

import { Button } from '@repo/react-common/button';

import { Item } from '../types';

interface ItemsTableActionsProps {
  item: Item;
  onEditItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
}

export default function ItemsTableActions(props: ItemsTableActionsProps) {
  const { item, onEditItem, onDeleteItem } = props;

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="unstyledIcon"
        color="primary"
        aria-label={`Edit ${item.name}`}
        onClick={() => onEditItem(item.id)}
      >
        <MdOutlineEdit className="h-5 w-5" />
      </Button>
      <Button
        variant="unstyledIcon"
        color="danger"
        aria-label={`Delete ${item.name}`}
        onClick={() => onDeleteItem(item.id)}
      >
        <MdDeleteOutline className="h-5 w-5" />
      </Button>
    </div>
  );
}
