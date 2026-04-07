import { IoShirt } from 'react-icons/io5';
import { MdHiking, MdOutlineSettings, MdShoppingBag } from 'react-icons/md';

import type { NavItem } from './types';

export const sampleNavTabs: NavItem[] = [
  { id: 'items', label: 'Items', icon: IoShirt, href: '#' },
  { id: 'collections', label: 'Collections', icon: MdShoppingBag, href: '#' },
  { id: 'trips', label: 'Trips', icon: MdHiking, href: '#' },
];

export const sampleSettingsLink: NavItem = {
  id: 'settings',
  label: 'Settings',
  icon: MdOutlineSettings,
  href: '#',
};
