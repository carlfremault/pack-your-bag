import DeleteItemModal from './DeleteItemModal';
import EditItemModal from './EditItemModal';

interface ItemsTableActionsProps {
  itemId: string;
}
export default function ItemsTableActions(props: ItemsTableActionsProps) {
  const { itemId } = props;

  return (
    <div className="flex items-center justify-center gap-2">
      <EditItemModal itemId={itemId} />
      <DeleteItemModal itemId={itemId} />
    </div>
  );
}
