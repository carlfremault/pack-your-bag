'use client';

import { DesktopHeader } from '@repo/react-common';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  getActiveTabFromPathname,
  navTabs,
  settingsLink,
} from '@/components/navigation/navigation';
import { logoutAction } from '@/features/auth/actions';

export function DesktopNav() {
  const pathname = usePathname();
  const activeTabId = getActiveTabFromPathname(pathname);

  return (
    <DesktopHeader
      tabs={navTabs}
      activeTabId={activeTabId}
      settingsLink={settingsLink}
      linkAs={Link}
      logOut={logoutAction}
    />
  );
}
