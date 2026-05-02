import { MdDeleteOutline, MdOutlineEdit } from 'react-icons/md';

import { Button } from '@repo/react-common/button';

export interface DataTableActionsProps {
  rowName: string;
  rowId: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DataTableActions(props: DataTableActionsProps) {
  const { rowName, rowId, onEdit, onDelete } = props;

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        type="button"
        variant="unstyledIcon"
        color="primary"
        aria-label={`Edit ${rowName}`}
        onClick={() => onEdit(rowId)}
      >
        <MdOutlineEdit className="h-5 w-5" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="unstyledIcon"
        color="danger"
        aria-label={`Delete ${rowName}`}
        onClick={() => onDelete(rowId)}
      >
        <MdDeleteOutline className="h-5 w-5" aria-hidden="true" />
      </Button>
    </div>
  );
}
