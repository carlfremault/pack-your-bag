import { Button, ButtonColor, SubmitButton } from '@repo/react-common/button';

export interface ConfirmationDialogProps {
  isPending: boolean;
  disabled?: boolean;
  onConfirm: () => void;
  closeForm: () => void;
  children: React.ReactNode;
  submitButtonColor?: ButtonColor;
}

export function ConfirmationDialog(props: ConfirmationDialogProps) {
  const {
    isPending,
    disabled = false,
    onConfirm,
    closeForm,
    children,
    submitButtonColor = 'danger',
  } = props;

  const handleConfirm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onConfirm();
  };

  return (
    <div className="flex flex-col gap-6">
      {children}
      <form onSubmit={handleConfirm} className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          color="primary"
          type="button"
          onClick={closeForm}
          disabled={isPending}
        >
          Cancel
        </Button>
        <SubmitButton color={submitButtonColor} pending={isPending} disabled={disabled}>
          Confirm
        </SubmitButton>
      </form>
    </div>
  );
}
