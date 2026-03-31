import { IoShirt } from 'react-icons/io5';
import { MdHiking, MdShoppingBag } from 'react-icons/md';

export const navTabs = [
  { id: 'items', label: 'Items', icon: IoShirt },
  { id: 'collections', label: 'Collections', icon: MdShoppingBag },
  { id: 'trips', label: 'Trips', icon: MdHiking },
] as const;
