import { IoShirtOutline } from 'react-icons/io5';
import { MdHiking, MdOutlineSettings, MdOutlineShoppingBag } from 'react-icons/md';

import ActionNavLinks from './ActionNavLinks';

export interface SidebarNavProps {
  pathname: string;
}

export function SidebarNav(props: SidebarNavProps) {
  const { pathname } = props;

  const collectionsView =
    pathname.startsWith('/collections') ||
    pathname.startsWith('/list') ||
    pathname.startsWith('/pack');
  const tripsView = pathname.startsWith('/trips');
  const settingsView = pathname.startsWith('/settings');

  let icon: React.ReactNode;
  if (collectionsView) {
    icon = <MdOutlineShoppingBag size={64} className="text-primary" aria-hidden="true" />;
  } else if (tripsView) {
    icon = <MdHiking size={64} className="text-primary" aria-hidden="true" />;
  } else if (settingsView) {
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
