import { MdOutlineSettings } from 'react-icons/md';

import Button from './Button';

export interface SettingsButtonProps {
  onClick: () => void;
}

export default function SettingsButton(props: SettingsButtonProps) {
  const { onClick } = props;

  return (
    <Button onClick={onClick} variant="ghost" color="primary" aria-label="Settings">
      <MdOutlineSettings className="h-5 w-5" aria-hidden="true" />
    </Button>
  );
}
