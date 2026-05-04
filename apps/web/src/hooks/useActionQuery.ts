import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

export function useActionQuery() {
  const searchParams = useSearchParams();

  const actionQuery = useMemo(() => {
    const action = searchParams.get('action');
    if (!action) return undefined;
    const params = new URLSearchParams();
    params.set('action', action);
    const id = searchParams.get('id');
    const editCollectionType = searchParams.get('edit-type');
    if (id) params.set('id', id);
    if (editCollectionType) params.set('edit-type', editCollectionType);
    return params.toString();
  }, [searchParams]);

  return actionQuery;
}
