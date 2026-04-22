'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { DesktopHeader } from '@repo/react-common/header';

import {
  buildTabsWithActionParams,
  getActiveTabFromPathname,
  navTabs,
  settingsLink,
} from '@/components/Navigation/navigation';
import { logoutAction } from '@/features/auth/actions';

function DesktopNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTabId = getActiveTabFromPathname(pathname);
  const tabs = buildTabsWithActionParams(navTabs, searchParams);

  return (
    <DesktopHeader
      tabs={tabs}
      activeTabId={activeTabId}
      settingsLink={settingsLink}
      linkAs={Link}
      logOut={logoutAction}
    />
  );
}

export function DesktopNav() {
  return (
    <Suspense fallback={null}>
      <DesktopNavInner />
    </Suspense>
  );
}
