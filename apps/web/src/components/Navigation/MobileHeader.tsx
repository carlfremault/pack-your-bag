'use client';

import Link from 'next/link';

import { MobileHeader as MobileHeaderBase } from '@repo/react-common/header';

import { settingsLink } from '@/components/Navigation/navigation';
import { logoutAction } from '@/features/auth/actions';

export function MobileHeader() {
  return <MobileHeaderBase settingsLink={settingsLink} linkAs={Link} logOut={logoutAction} />;
}
