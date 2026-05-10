'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { MobileBottomNav } from '@repo/react-common/navigation';

import { getActiveTabFromPathname, navTabs } from '@/components/Navigation/navigation';

export function MobileNav() {
  const pathname = usePathname();
  const activeTabId = getActiveTabFromPathname(pathname);

  return <MobileBottomNav tabs={navTabs} activeTabId={activeTabId} linkAs={Link} />;
}
