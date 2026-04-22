import { IoShirtOutline } from 'react-icons/io5';
import Link from 'next/link';

import { LinkButton } from '@repo/react-common/button';

export function SidebarNav() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-surface-overlay flex items-center justify-center rounded-full p-4">
        <IoShirtOutline size={64} className="text-primary" aria-hidden="true" />
      </div>
      <LinkButton
        href="?action=add-item"
        color="primary"
        linkAs={Link}
        variant="solid"
        size="large"
        className="w-full"
      >
        Add new item
      </LinkButton>
      <LinkButton
        href="?action=manage-categories"
        color="primary"
        linkAs={Link}
        variant="outline"
        size="large"
        className="w-full"
      >
        Manage categories
      </LinkButton>
    </div>
  );
}
