import { IoShirt } from 'react-icons/io5';
import { MdAutoAwesome, MdHiking, MdOutlineSettings, MdShoppingBag } from 'react-icons/md';

import type { NavItem } from '@repo/react-common/navigation';

export const navTabs: NavItem[] = [
  { id: 'items', label: 'Items', icon: IoShirt, href: '/items' },
  { id: 'collections', label: 'Collections', icon: MdShoppingBag, href: '/collections' },
  { id: 'trips', label: 'Trips', icon: MdHiking, href: '/trip' },
  { id: 'assistant', label: 'Assistant', icon: MdAutoAwesome, href: '/assistant' },
];

export const settingsLink: NavItem = {
  id: 'settings',
  label: 'Settings',
  icon: MdOutlineSettings,
  href: '/settings',
};

const collectionsPatterns = ['/collections', '/list', '/pack'];

export function getActiveTabFromPathname(pathname: string): NavItem['id'] | undefined {
  if (collectionsPatterns.some((p) => pathname.startsWith(p))) return 'collections';
  const tab = navTabs.find((t) => pathname.startsWith(t.href));
  return tab?.id;
}

export function buildTabsWithActionParams(
  tabs: NavItem[],
  searchParams: { get: (key: string) => string | null },
): NavItem[] {
  const action = searchParams.get('action');
  if (!action) return tabs;

  const params = new URLSearchParams();
  params.set('action', action);
  const id = searchParams.get('id');
  const editCollectionType = searchParams.get('edit-type');
  if (id) params.set('id', id);
  if (editCollectionType) params.set('edit-type', editCollectionType);
  const query = params.toString();

  return tabs.map((tab) => ({ ...tab, href: `${tab.href}?${query}` }));
}
