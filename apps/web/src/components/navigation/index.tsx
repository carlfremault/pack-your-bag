'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

import Button from '../ui/buttons/button';

export default function Navigation() {
  const pathname = usePathname();
  const isActive = (path: string) =>
    pathname === path || (pathname.startsWith(path) && path !== '/');

  const navigationItems = [
    { label: 'Items', href: '/items' },
    { label: 'Lists', href: '/lists' },
    { label: 'Packs', href: '/packs' },
    { label: 'Trips', href: '/trips' },
  ];

  return (
    <nav className="flex items-center justify-between border-b border-b-cyan-600 bg-blue-500 p-4">
      <div className="flex gap-4">
        {navigationItems.map((item) => (
          <Link
            href={item.href}
            key={item.href}
            className={isActive(item.href) ? 'text-white' : 'text-blue-900'}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Link href="/" className="px-4 text-white">
          PackYourBag.com
        </Link>
        <div className="h-6 w-px bg-white" />
        <Button type="button" onClick={() => signOut({ redirectTo: '/' })}>
          Sign out
        </Button>
      </div>
    </nav>
  );
}
