import Link from 'next/link';

import { LinkButton } from '@repo/react-common/button';

type DrawerNavProps = {
  onNavigate?: () => void;
};

export function DrawerNav({ onNavigate }: DrawerNavProps) {
  return (
    <div className="flex flex-col gap-4">
      <LinkButton
        href="/items?action=add-item"
        variant="solid"
        color="primary"
        size="large"
        className="w-full"
        linkAs={Link}
        onClick={onNavigate}
      >
        Add new item
      </LinkButton>
      <LinkButton
        href="/items?action=manage-categories"
        variant="outline"
        color="primary"
        size="large"
        className="w-full"
        linkAs={Link}
        onClick={onNavigate}
      >
        Manage categories
      </LinkButton>
    </div>
  );
}
