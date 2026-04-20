'use client';

import toast from 'react-hot-toast';

import {
  environmentManager,
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { SESSION_EXPIRED_MESSAGE } from '@/lib/constants';
import { extractErrorMessage } from '@/utils/extractApiErrorDetails';

import { SidebarProvider } from './Sidebar';

// -------------------------------
// React Query
// -------------------------------

function onQueryError(error: Error) {
  if (error.message === SESSION_EXPIRED_MESSAGE) {
    window.location.replace('/login?reason=session_expired');
    return;
  }
  toast.error(extractErrorMessage(error));
}

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: onQueryError }),
    mutationCache: new MutationCache({ onError: onQueryError }),
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
