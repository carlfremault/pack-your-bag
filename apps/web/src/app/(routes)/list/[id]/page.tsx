import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { getList } from '@/features/collection/api';
import CollectionDetails from '@/features/collection/components/CollectionDetails';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['list', id],
    queryFn: () => getList(id),
  });

  return (
    <div className="flex h-full w-full justify-center">
      <h1 className="sr-only">List details</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CollectionDetails type="list" id={id} />
      </HydrationBoundary>
    </div>
  );
}
