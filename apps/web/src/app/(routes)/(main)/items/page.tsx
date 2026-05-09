import { Suspense } from 'react';

import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { getAllItems } from '@/features/item/api';
import ItemsErrorFallback from '@/features/item/components/ItemsErrorFallback';
import ItemsView from '@/features/item/components/ItemsView';
import ItemsViewSkeleton from '@/features/item/components/ItemsViewSkeleton';

export default async function Page() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['items'],
    queryFn: () => getAllItems(),
  });

  return (
    <div className="flex w-full justify-center lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <h1 className="sr-only">Items</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ErrorBoundary fallback={<ItemsErrorFallback />}>
          <Suspense fallback={<ItemsViewSkeleton />}>
            <ItemsView />
          </Suspense>
        </ErrorBoundary>
      </HydrationBoundary>
    </div>
  );
}
