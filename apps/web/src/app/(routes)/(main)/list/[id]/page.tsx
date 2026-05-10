import { Suspense } from 'react';
import { Metadata } from 'next';

import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import ErrorFallback from '@/components/ErrorFallback';
import { getList } from '@/features/collection/api';
import CollectionDetails from '@/features/collection/components/CollectionDetails';
import CollectionDetailsSkeleton from '@/features/collection/components/CollectionDetailsSkeleton';

export const metadata: Metadata = {
  title: 'List details',
  description: 'Manage a list.',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['list', id],
    queryFn: async () => ({ ...(await getList(id)), type: 'list' as const }),
  });

  return (
    <div className="flex w-full justify-center lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <h1 className="sr-only">List details</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ErrorBoundary
          fallback={<ErrorFallback message="Failed to load list. Please try again later." />}
        >
          <Suspense fallback={<CollectionDetailsSkeleton />}>
            <CollectionDetails type="list" id={id} />
          </Suspense>
        </ErrorBoundary>
      </HydrationBoundary>
    </div>
  );
}
