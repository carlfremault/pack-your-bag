import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';

import { dehydrate, QueryClient } from '@tanstack/react-query';

import { Providers } from '@/components/Providers';
import { ActionPanel } from '@/components/Sidebar/ActionPanel';
import { ToastNotifications } from '@/components/ToastNotifications';
import { createPreferences, getPreferences } from '@/features/settings/api';
import { ThemeSynchronizer } from '@/features/settings/components/ThemeSynchronizer';
import { deriveDefaultPreferences, parseAcceptLanguage } from '@/features/settings/defaults';
import { getSession } from '@/lib/session';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'),
  title: 'PackYourBag!',
  description:
    'Your modular packing list companion. Organize items, build reusable lists, assemble packs, and never forget a thing.',
  openGraph: {
    title: 'PackYourBag!',
    description:
      'Your modular packing list companion. Organize items, build reusable lists, assemble packs, and never forget a thing.',
    type: 'website',
    siteName: 'PackYourBag!',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PackYourBag!',
    description:
      'Your modular packing list companion. Organize items, build reusable lists, assemble packs, and never forget a thing.',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const isLoggedIn = session.isLoggedIn ?? false;

  let preferences = isLoggedIn ? await getPreferences().catch(() => null) : null;
  if (isLoggedIn && !preferences) {
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language');
    const defaults = deriveDefaultPreferences(parseAcceptLanguage(acceptLanguage));
    preferences = await createPreferences(defaults).catch(() => null);
  }
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
          {children}
          {isLoggedIn && <ActionPanel />}
          {isLoggedIn && <ThemeSynchronizer />}
          <ToastNotifications />
        </Providers>
      </body>
    </html>
  );
}
