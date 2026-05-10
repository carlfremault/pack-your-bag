'use client';

import Link from 'next/link';

import { Alert } from '@repo/react-common/alert';
import { Button, LinkButton } from '@repo/react-common/button';
import { UnAuthenticatedHeader } from '@repo/react-common/header';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <UnAuthenticatedHeader />
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
        <Alert type="error" message="Something went wrong :(" />
        <div className="flex gap-3">
          <Button onClick={reset}>Try again</Button>
          <LinkButton href="/" linkAs={Link}>
            Back to safety!
          </LinkButton>
        </div>
      </div>
    </>
  );
}
