import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { getAllCategories } from '@/features/category/api';
import { getAllItems } from '@/features/item/api';
import ItemsView from '@/features/item/components/ItemsView';

export default async function Page() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['items'],
    queryFn: () => getAllItems(),
  });

  await queryClient.prefetchQuery({
    queryKey: ['categories'],
    queryFn: () => getAllCategories(),
  });

  return (
    <div className="flex justify-center">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ItemsView />
      </HydrationBoundary>
    </div>
  );
}
