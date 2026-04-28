import { IoShirtOutline } from 'react-icons/io5';

import ActionNavLinks from './ActionNavLinks';

export function SidebarNav() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-surface-overlay flex items-center justify-center rounded-full p-4">
        <IoShirtOutline size={64} className="text-primary" aria-hidden="true" />
      </div>
      <ActionNavLinks />
    </div>
  );
}
