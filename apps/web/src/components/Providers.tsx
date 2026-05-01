'use client';

import toast from 'react-hot-toast';

import {
  type DehydratedState,
  environmentManager,
  HydrationBoundary,
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { SESSION_EXPIRED_MESSAGE } from '@/lib/constants';
import { HttpError } from '@/lib/errors';
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

function isFieldLevelError(error: Error): boolean {
  return (
    error instanceof HttpError &&
    typeof error.details === 'object' &&
    error.details !== null &&
    typeof (error.details as { properties?: unknown }).properties === 'object'
  );
}

function onMutationError(error: Error) {
  if (error.message === SESSION_EXPIRED_MESSAGE) {
    window.location.replace('/login?reason=session_expired');
    return;
  }
  if (isFieldLevelError(error)) return;
  toast.error(extractErrorMessage(error));
}

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: onQueryError }),
    mutationCache: new MutationCache({ onError: onMutationError }),
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (environmentManager.isServer()) {
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

// --------------------------------
// Providers
// --------------------------------

export function Providers({
  children,
  dehydratedState,
}: {
  children: React.ReactNode;
  dehydratedState?: DehydratedState;
}) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        <SidebarProvider>{children}</SidebarProvider>
      </HydrationBoundary>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
