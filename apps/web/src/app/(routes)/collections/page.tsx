import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { getAllCollections } from '@/features/collection/api';
import CollectionsView from '@/features/collection/components/CollectionsView';

export default async function Page() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['collections'],
    queryFn: () => getAllCollections(),
  });

  return (
    <div className="flex w-full justify-center lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <h1 className="sr-only">Collections</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CollectionsView />
      </HydrationBoundary>
    </div>
  );
}
