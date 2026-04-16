'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { DesktopHeader } from '@repo/react-common/header';

import {
  getActiveTabFromPathname,
  navTabs,
  settingsLink,
} from '@/components/Navigation/navigation';
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
