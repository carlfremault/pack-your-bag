'use client';

import { MobileBottomNav } from '@repo/react-common';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { getActiveTabFromPathname, navTabs } from '@/components/navigation/navigation';

export function MobileNav() {
  const pathname = usePathname();
  const activeTabId = getActiveTabFromPathname(pathname);

  return <MobileBottomNav tabs={navTabs} activeTabId={activeTabId} linkAs={Link} />;
}
