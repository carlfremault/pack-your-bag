'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import { Alert } from '@repo/react-common/alert';
import { Button, LinkButton } from '@repo/react-common/button';
import { UnAuthenticatedHeader } from '@repo/react-common/header';

import * as Sentry from '@sentry/nextjs';

function isStaleActionError(error: Error): boolean {
  return error.name === 'UnrecognizedActionError' || error.message.includes('Server Action');
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const stale = isStaleActionError(error);

  useEffect(() => {
    if (stale) {
      window.location.reload();
      return;
    }
    Sentry.captureException(error);
  }, [error, stale]);

  if (stale) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground text-sm">Updating to latest version...</p>
      </div>
    );
  }

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
