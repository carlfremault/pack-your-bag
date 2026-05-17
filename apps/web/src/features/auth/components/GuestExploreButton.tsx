'use client';

import { useTransition } from 'react';
import { MdOutlineExplore } from 'react-icons/md';

import { Button } from '@repo/react-common/button';

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
    <Button
      variant="outline"
      className="w-full gap-2"
      onClick={handleExplore}
      disabled={isPending}
      aria-label={isPending ? 'Setting up…' : 'Explore a sample trip'}
    >
      {isPending ? 'Setting up…' : 'Explore a sample trip'}
      <MdOutlineExplore size={24} className="text-primary shrink-0" aria-hidden="true" />
    </Button>
  );
}
