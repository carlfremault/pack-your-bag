import Button from '../buttons/button';

interface ConfirmationDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}
export default function ConfirmationDialog(props: ConfirmationDialogProps) {
  const { message, onConfirm, onCancel } = props;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-message"
      className="flex flex-col gap-4"
    >
      <h2 id="confirmation-dialog-title" className="sr-only">
        Confirmation
      </h2>
      <p id="confirmation-dialog-message">{message}</p>
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
