import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';

import { Sidebar } from '@repo/react-common/sidebar';

import { dehydrate, QueryClient } from '@tanstack/react-query';

import { DesktopNav } from '@/components/Navigation/DesktopNav';
import { MobileHeader } from '@/components/Navigation/MobileHeader';
import { MobileNav } from '@/components/Navigation/MobileNav';
import { MobileNavDrawer } from '@/components/Navigation/MobileNavDrawer';
import { Providers } from '@/components/Providers';
import { SidebarSlot } from '@/components/Sidebar';
import { ActionPanel } from '@/components/Sidebar/ActionPanel';
import { ToastNotifications } from '@/components/ToastNotifications';
import { getPreferences } from '@/features/settings/api';
import { PreferencesInitializer } from '@/features/settings/components/PreferencesInitializer';
import { ThemeSynchronizer } from '@/features/settings/components/ThemeSynchronizer';
import { getSession } from '@/lib/session';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'PackYourBag!',
  description: 'Luggage management app',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const isLoggedIn = session.isLoggedIn ?? false;

  const preferences = isLoggedIn ? await getPreferences().catch(() => null) : null;
  const theme = preferences?.theme;

  const queryClient = new QueryClient();
  if (isLoggedIn) {
    queryClient.setQueryData(['preferences'], preferences);
  }
  const dehydratedState = dehydrate(queryClient);

  return (
    <html lang="en" className={[inter.variable, theme].filter(Boolean).join(' ')}>
      <body>
        <Providers dehydratedState={dehydratedState}>
          <div className="flex h-screen flex-col lg:flex-row">
            <div className="hidden w-1/4 min-w-80 lg:block">
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

              <main className="mb-16 flex-1 overflow-y-auto lg:mb-0">{children}</main>

              <div className="lg:hidden">
                <MobileNavDrawer />
                <MobileNav />
              </div>
            </div>
          </div>
          {isLoggedIn && <ActionPanel />}
          {isLoggedIn && <PreferencesInitializer />}
          {isLoggedIn && <ThemeSynchronizer />}
          <ToastNotifications />
        </Providers>
      </body>
    </html>
  );
}
