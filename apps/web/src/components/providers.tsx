'use client';

import { isServer, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { SESSION_EXPIRED_MESSAGE } from '@/lib/errors';

function onSessionExpired(error: Error) {
  if (error.message === SESSION_EXPIRED_MESSAGE) {
    window.location.replace('/login');
  }
}

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: onSessionExpired }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
