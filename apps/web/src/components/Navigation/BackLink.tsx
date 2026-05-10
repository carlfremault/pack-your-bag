'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@repo/react-common/button';

export function BackLink({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <Button variant="link" onClick={() => router.back()} className={className}>
      &larr; Back
    </Button>
  );
}
