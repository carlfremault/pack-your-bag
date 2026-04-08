'use client';

import { MobileHeader as MobileHeaderBase } from '@repo/react-common/header';

import Link from 'next/link';

import { settingsLink } from '@/components/navigation/navigation';
import { logoutAction } from '@/features/auth/actions';

export function MobileHeader() {
  return <MobileHeaderBase settingsLink={settingsLink} linkAs={Link} logOut={logoutAction} />;
}
