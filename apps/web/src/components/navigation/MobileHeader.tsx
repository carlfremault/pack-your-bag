'use client';

import { MobileHeader as MobileHeaderBase } from '@repo/react-common';

import Link from 'next/link';

import { settingsLink } from '@/components/navigation/navigation';

export function MobileHeader() {
  return <MobileHeaderBase settingsLink={settingsLink} linkAs={Link} />;
}
