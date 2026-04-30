import { IoShirtOutline } from 'react-icons/io5';
import { MdHiking, MdOutlineSettings, MdOutlineShoppingBag } from 'react-icons/md';

import ActionNavLinks from './ActionNavLinks';

export interface SidebarNavProps {
  pathname: string;
}

export function SidebarNav(props: SidebarNavProps) {
  const { pathname } = props;

  let icon: React.ReactNode;
  if (pathname.startsWith('/collections')) {
    icon = <MdOutlineShoppingBag size={64} className="text-primary" aria-hidden="true" />;
  } else if (pathname.startsWith('/trips')) {
    icon = <MdHiking size={64} className="text-primary" aria-hidden="true" />;
  } else if (pathname.startsWith('/settings')) {
    icon = <MdOutlineSettings size={64} className="text-primary" aria-hidden="true" />;
  } else {
    icon = <IoShirtOutline size={64} className="text-primary" aria-hidden="true" />;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-surface-overlay flex items-center justify-center rounded-full p-4">
        {icon}
      </div>
      <ActionNavLinks />
    </div>
  );
}
