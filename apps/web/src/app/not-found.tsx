import Link from 'next/link';

import { LinkButton } from '@repo/react-common/button';
import { UnAuthenticatedHeader } from '@repo/react-common/header';

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col">
      <UnAuthenticatedHeader />
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-xl font-semibold">Page not found :(</h1>
        <p className="text-muted-foreground text-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <LinkButton href="/" linkAs={Link}>
          Back to safety!
        </LinkButton>
      </div>
    </div>
  );
}
