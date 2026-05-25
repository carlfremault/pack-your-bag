import Link from 'next/link';

import { Sidebar } from '@repo/react-common/sidebar';

import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { DesktopNav } from '@/components/Navigation/DesktopNav';
import { MobileHeader } from '@/components/Navigation/MobileHeader';
import { MobileNav } from '@/components/Navigation/MobileNav';
import { MobileNavDrawer } from '@/components/Navigation/MobileNavDrawer';
import { SidebarSlot } from '@/components/Sidebar';
import { getAllCategories } from '@/features/category/api';

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['categories'],
    queryFn: () => getAllCategories(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex h-dvh flex-col lg:flex-row">
        <div className="hidden w-1/4 max-w-xl min-w-80 lg:block">
          <Sidebar linkAs={Link}>
            <SidebarSlot />
          </Sidebar>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="hidden lg:block">
            <DesktopNav />
          </div>
          <div className="lg:hidden">
            <MobileHeader />
          </div>

          <main className="mb-16 flex-1 overflow-y-auto lg:mb-0 lg:flex lg:flex-col">
            {children}
          </main>

          <div className="lg:hidden">
            <MobileNavDrawer />
            <MobileNav />
          </div>
        </div>
      </div>
    </HydrationBoundary>
  );
}
