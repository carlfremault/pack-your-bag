import Link from 'next/link';

import { LinkButton } from '@repo/react-common/button';

type DrawerNavProps = {
  onNavigate?: () => void;
};

export function DrawerNav({ onNavigate }: DrawerNavProps) {
  return (
    <div className="flex flex-col gap-2">
      <LinkButton
        href="/items?action=add"
        variant="solid"
        color="primary"
        size="large"
        className="w-full"
        linkAs={Link}
        onClick={onNavigate}
      >
        Add new item
      </LinkButton>
    </div>
  );
}
