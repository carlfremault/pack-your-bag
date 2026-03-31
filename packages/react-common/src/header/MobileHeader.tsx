import { MdOutlineSettings } from 'react-icons/md';

import Button from '../button/Button';

export interface MobileHeaderProps {
  onSettingsClick: () => void;
}

export default function MobileHeader(props: MobileHeaderProps) {
  const { onSettingsClick } = props;

  return (
    <header className="border-primary-ring bg-background z-10 flex items-center justify-between border-b px-4 py-3 shadow-sm">
      <div className="from-logo-gradient-from to-logo-gradient-to bg-linear-to-r bg-clip-text text-lg font-bold text-transparent">
        PackYourBag!
      </div>

      <Button onClick={onSettingsClick} variant="ghost" color="primary" aria-label="Settings">
        <MdOutlineSettings className="h-5 w-5" />
      </Button>
    </header>
  );
}
