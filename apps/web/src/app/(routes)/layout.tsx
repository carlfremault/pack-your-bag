import type { Metadata } from 'next';

import Navigation from '@/components/navigation';
import Providers from '@/components/providers';

import '../globals.css';

export const metadata: Metadata = {
  title: 'PackYourBag - Frontend tryout',
  description: 'Draft of the PackYourBag frontend',
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
