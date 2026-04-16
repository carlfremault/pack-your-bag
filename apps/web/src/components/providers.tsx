'use client';

import {
  environmentManager,
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { SESSION_EXPIRED_MESSAGE } from '@/lib/constants';

import { SidebarProvider } from './Sidebar';

// -------------------------------
// React Query
// -------------------------------

function onSessionExpired(error: Error) {
  if (error.message === SESSION_EXPIRED_MESSAGE) {
    window.location.replace('/login');
  }
}

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: onSessionExpired }),
    mutationCache: new MutationCache({ onError: onSessionExpired }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (environmentManager.isServer()) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

// --------------------------------
// Providers
// --------------------------------

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>{children}</SidebarProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
