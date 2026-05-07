'use client';

import { Button, SubmitButton } from '@repo/react-common/button';

interface FormWrapperProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onClose: () => void;
  isPending: boolean;
  editMode?: boolean;
  children: React.ReactNode;
}

export function FormWrapper({
  onSubmit,
  onReset,
  onClose,
  isPending,
  editMode = false,
  children,
}: FormWrapperProps) {
  return (
    <form onSubmit={onSubmit}>
      <fieldset
        disabled={isPending}
        className="flex flex-col gap-4 transition-opacity disabled:opacity-50"
      >
        {children}
        <div className="flex flex-col items-center gap-2">
          <SubmitButton pending={isPending} className="w-full">
            Save
          </SubmitButton>
          <div className="flex w-full items-center justify-between gap-2">
            {editMode && (
              <Button type="button" onClick={onReset} variant="outline" className="w-full">
                Reset
              </Button>
            )}
            <Button type="button" onClick={onClose} variant="outline" className="w-full">
              {editMode ? 'Cancel' : 'Back'}
            </Button>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
