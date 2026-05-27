'use client';

import { useTransition } from 'react';
import { MdOutlineExplore } from 'react-icons/md';

import { Button } from '@repo/react-common/button';

import { Modal } from '@/components/Modal';
import { ExploreModalTitle } from '@/components/Modal/ModalTitle';

import { guestSessionAction } from '../actions';

export default function GuestExploreButton() {
  const [isPending, startTransition] = useTransition();

  function handleExplore() {
    startTransition(async () => {
      const result = await guestSessionAction();
      if (result?.formError) {
        console.error('Guest session failed:', result.formError);
      }
    });
  }

  return (
    <Modal.Root>
      <Modal.Trigger
        color="primary"
        variant="outline"
        disabled={isPending}
        className="w-full"
        ariaLabel="Explore a sample trip"
      >
        <div className="flex w-full items-center justify-center gap-2">
          Explore a sample trip
          <MdOutlineExplore size={24} className="text-primary shrink-0" aria-hidden="true" />
        </div>
      </Modal.Trigger>
      <Modal.Content
        title={<ExploreModalTitle label="Explore a sample trip" />}
        titleColor="primary"
        role="dialog"
        ariaDescribedBy="modal-description"
      >
        <div className="text-primary flex flex-col gap-4 text-sm">
          <p>Welcome!</p>
          <p>
            As a guest you have full access — create, edit, and delete anything. Data is
            automatically removed after 24 hours of inactivity.
          </p>
          <p className="mb-4">Happy exploring!</p>
          <Button
            className="w-full gap-2"
            onClick={handleExplore}
            disabled={isPending}
            aria-label={isPending ? 'Setting up…' : 'Explore a sample trip'}
          >
            {isPending ? 'Setting up…' : "Let's go!"}
          </Button>
        </div>
      </Modal.Content>
    </Modal.Root>
  );
}
