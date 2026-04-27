'use client';

import { Button } from '@repo/react-common/button';

import { Modal } from '@/components/Modal';
import { logoutAllAction } from '@/features/auth/actions';

export default function LogoutAllDevicesCard() {
  return (
    <div className="bg-surface border-primary-ring text-primary flex w-full flex-col gap-4 rounded-md border p-4 shadow-sm">
      End all active sessions across your devices, including this one.
      <div className="flex justify-end">
        <Modal.Root>
          <Modal.Trigger color="danger" variant="outline">
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
