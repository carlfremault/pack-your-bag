import { Button, ButtonColor, SubmitButton } from '@repo/react-common/button';

export interface ConfirmationDialogProps {
  isPending: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  submitButtonColor?: ButtonColor;
  submitButtonText?: string;
}

export function ConfirmationDialog(props: ConfirmationDialogProps) {
  const {
    isPending,
    isLoading = false,
    onConfirm,
    onClose,
    submitButtonColor = 'danger',
    submitButtonText = 'Submit',
  } = props;

  const handleConfirm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onConfirm();
  };

  return (
    <form onSubmit={handleConfirm} className="flex items-center gap-2 lg:justify-end">
      <Button
        variant="outline"
        color="primary"
        type="button"
        onClick={onClose}
        disabled={isPending}
        className="w-full lg:w-auto"
      >
        Cancel
      </Button>
      <SubmitButton
        color={submitButtonColor}
        pending={isPending}
        disabled={isLoading}
        className="w-full lg:w-auto"
      >
        {submitButtonText}
      </SubmitButton>
    </form>
  );
}
