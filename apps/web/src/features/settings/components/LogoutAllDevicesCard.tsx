'use client';

import { Button } from '@repo/react-common/button';

import classNames from 'classnames';

import { Modal } from '@/components/Modal';
import { logoutAllAction } from '@/features/auth/actions';

export interface LogoutAllDevicesCardProps {
  disabled?: boolean;
}

export default function LogoutAllDevicesCard({ disabled = false }: LogoutAllDevicesCardProps) {
  return (
    <div
      className={classNames(
        'bg-surface border-primary-ring text-primary flex w-full flex-col gap-4 rounded-md border p-4 shadow-sm transition-opacity',
        disabled && 'opacity-50',
      )}
      aria-disabled={disabled}
    >
      End all active sessions across your devices, including this one.
      {disabled && (
        <p className="text-primary/70 text-sm italic">
          Sign up for a full account to manage sessions.
        </p>
      )}
      <div className="flex justify-end">
        <Modal.Root>
          <Modal.Trigger color="danger" variant="outline" disabled={disabled}>
            Sign out all devices
          </Modal.Trigger>
          <Modal.Content
            title="Sign out all devices"
            ariaDescribedBy="modal-description"
            role="alertdialog"
          >
            {(closeModal) => (
              <div className="flex flex-col gap-4">
                <p id="modal-description" className="text-primary">
                  This will sign you out of all active sessions, including this one. Are you sure?
                </p>
                <form action={logoutAllAction} className="flex items-center justify-end gap-2">
                  <Button variant="outline" type="button" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button type="submit" color="danger">
                    Confirm
                  </Button>
                </form>
              </div>
            )}
          </Modal.Content>
        </Modal.Root>
      </div>
    </div>
  );
}
