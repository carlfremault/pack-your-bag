import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { getItems } from '@/features/items/api';
import ItemsTable from '@/features/items/components/ItemsTable';

export default async function Page() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['items'],
    queryFn: () => getItems(),
  });

  return (
    <main className="flex min-h-screen justify-center">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ItemsTable />
      </HydrationBoundary>
    </main>
  );
}
