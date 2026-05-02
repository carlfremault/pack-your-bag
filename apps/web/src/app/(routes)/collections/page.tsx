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
    <div className="flex w-full justify-center">
      <h1 className="sr-only">Collections</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CollectionsView />
      </HydrationBoundary>
    </div>
  );
}
