import { Suspense } from 'react';

import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { getPack } from '@/features/collection/api';
import CollectionDetails from '@/features/collection/components/CollectionDetails';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['pack', id],
    queryFn: async () => ({ ...(await getPack(id)), type: 'pack' as const }),
  });

  return (
    <div className="flex w-full justify-center lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <h1 className="sr-only">Pack details</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense>
          <CollectionDetails type="pack" id={id} />
        </Suspense>
      </HydrationBoundary>
    </div>
  );
}
