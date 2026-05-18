'use client';

import { useEffect } from 'react';
import { Inter } from 'next/font/google';

import { Button } from '@repo/react-common/button';
import { LinkButton } from '@repo/react-common/button';
import { UnAuthenticatedHeader } from '@repo/react-common/header';

import * as Sentry from '@sentry/nextjs';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className={inter.variable}>
      <body>
        <div className="flex h-screen flex-col">
          <UnAuthenticatedHeader />
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 p-8">
            <h1 className="text-xl font-semibold">Something went wrong :(</h1>
            <div className="flex gap-3">
              <Button onClick={reset}>Try again</Button>
              <LinkButton href="/">Back to safety!</LinkButton>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
