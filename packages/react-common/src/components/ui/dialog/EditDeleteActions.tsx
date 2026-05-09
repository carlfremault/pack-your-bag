import { MdDeleteOutline, MdOutlineEdit } from 'react-icons/md';

import { Button } from '@repo/react-common/button';

export interface EditDeleteActionsProps {
  name: string;
  id: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function EditDeleteActions(props: EditDeleteActionsProps) {
  const { name, id, onEdit, onDelete } = props;

  return (
    <>
      <Button
        type="button"
        variant="unstyledIcon"
        color="primary"
        aria-label={`Edit ${name}`}
        onClick={() => onEdit(id)}
      >
        <MdOutlineEdit className="h-5 w-5" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="unstyledIcon"
        color="danger"
        aria-label={`Delete ${name}`}
        onClick={() => onDelete(id)}
      >
        <MdDeleteOutline className="h-5 w-5" aria-hidden="true" />
      </Button>
    </>
  );
}
