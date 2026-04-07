import { IoShirt } from 'react-icons/io5';
import { MdHiking, MdOutlineSettings, MdShoppingBag } from 'react-icons/md';

import type { NavItem } from '@repo/react-common';

export const navTabs: NavItem[] = [
  { id: 'items', label: 'Items', icon: IoShirt, href: '/items' },
  { id: 'collections', label: 'Collections', icon: MdShoppingBag, href: '/collections' },
  { id: 'trips', label: 'Trips', icon: MdHiking, href: '/trips' },
];

export const settingsLink: NavItem = {
  id: 'settings',
  label: 'Settings',
  icon: MdOutlineSettings,
  href: '/settings',
};

export function getActiveTabFromPathname(pathname: string): NavItem['id'] | undefined {
  const tab = navTabs.find((t) => pathname.startsWith(t.href));
  return tab?.id;
}
