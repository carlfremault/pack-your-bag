import { Logo } from '../logo/Logo';

export interface SidebarProps {
  linkAs?: React.ElementType;
  children?: React.ReactNode;
}
export function Sidebar(props: SidebarProps) {
  const { linkAs: LinkComponent = 'a', children } = props;

  return (
    <aside className="border-primary-ring bg-surface flex h-full min-w-64 flex-1 flex-col gap-8 border-r border-l px-4 py-3 shadow-sm">
      <div className="self-start">
        <LinkComponent
          href="/"
          aria-label="Go to homepage"
          className="focus-visible:ring-primary-ring rounded focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Logo />
        </LinkComponent>
      </div>
      <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col items-center justify-center">
        {children}
      </div>
    </aside>
  );
}
