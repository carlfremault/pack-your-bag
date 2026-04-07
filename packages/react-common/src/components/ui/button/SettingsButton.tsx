import type { NavItem } from '../navigation/types';

export interface SettingsButtonProps {
  link: NavItem;
  linkAs?: React.ElementType;
}

export function SettingsButton({ link, linkAs: LinkComponent = 'a' }: SettingsButtonProps) {
  const { icon: Icon, href, label } = link;

  const linkClassName =
    'text-primary/80 hover:text-primary ring-primary-ring inline-flex h-11 cursor-pointer items-center justify-center rounded-md px-3 transition-[filter,transform,box-shadow,color] duration-150 ease-out focus-visible:ring-2 focus-visible:outline-none active:scale-90 active:brightness-90';

  return (
    <LinkComponent href={href} aria-label={label} className={linkClassName}>
      <Icon className="h-5 w-5" aria-hidden="true" />
    </LinkComponent>
  );
}
