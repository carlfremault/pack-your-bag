import { MdArrowBack } from 'react-icons/md';
import Link from 'next/link';

import { LinkButton } from '@repo/react-common/button';

export default function BackButton() {
  return (
    <div className="hidden lg:block">
      <LinkButton
        href="/items"
        variant="link"
        linkAs={Link}
        aria-label="Back to items view"
        className="flex items-center gap-2 text-xs"
      >
        <MdArrowBack className="h-4 w-4" aria-hidden="true" focusable="false" /> Back
      </LinkButton>
    </div>
  );
}
