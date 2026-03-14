import Button from '../buttons/button';

interface ConfirmationDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}
export default function ConfirmationDialog(props: ConfirmationDialogProps) {
  const { message, onConfirm, onCancel } = props;

  return (
    <div className="flex flex-col gap-4">
      <p>{message}</p>
      <div className="flex justify-center gap-4">
        <Button color="danger" onClick={onConfirm}>
          Confirm
        </Button>
        <Button color="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
