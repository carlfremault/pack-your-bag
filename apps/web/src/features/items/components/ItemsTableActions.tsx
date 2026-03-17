import { Item } from '../types';

import DeleteItemModal from './DeleteItemModal';
import EditItemModal from './EditItemModal';

interface ItemsTableActionsProps {
  item: Item;
}
export default function ItemsTableActions(props: ItemsTableActionsProps) {
  const { item } = props;

  return (
    <div className="flex items-center justify-center gap-2">
      <EditItemModal item={item} />
      <DeleteItemModal item={item} />
    </div>
  );
}
