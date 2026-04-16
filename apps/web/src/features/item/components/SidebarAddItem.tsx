import { IoShirtOutline } from 'react-icons/io5';
import Link from 'next/link';

import { LinkButton } from '@repo/react-common/button';

export default function SidebarAddItem() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-surface-overlay flex items-center justify-center rounded-full p-4">
        <IoShirtOutline size={64} className="text-primary" />
      </div>
      <LinkButton
        href="/items?action=add"
        color="primary"
        linkAs={Link}
        variant="solid"
        size="medium"
      >
        Add new item
      </LinkButton>
    </div>
  );
}
