'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

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
      <div className="text-white">PackYourBag.com</div>
    </nav>
  );
}
