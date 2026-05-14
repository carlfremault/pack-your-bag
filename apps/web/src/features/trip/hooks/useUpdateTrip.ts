import { useCallback, useEffect, useRef } from 'react';

import { useUpdateTripItemStatus } from '../queries';

export function useUpdateTrip() {
  const { mutate: updateTripItemStatus, isPending } = useUpdateTripItemStatus();

  const pendingMutations = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  useEffect(() => {
    const pending = pendingMutations.current;
    return () => {
      Object.values(pending).forEach(clearTimeout);
    };
  }, []);

  const handleUpdateTripItemStatus = useCallback(
    (itemId: string, quantity: number, tripId: string) => {
      const key = `trip-${tripId}-item-${itemId}`;
      clearTimeout(pendingMutations.current[key]);
      pendingMutations.current[key] = setTimeout(() => {
        delete pendingMutations.current[key];
        updateTripItemStatus({ id: tripId, itemId, body: { packedQuantity: quantity } });
      }, 600);
    },
    [updateTripItemStatus],
  );

  return {
    handleUpdateTripItemStatus,
    isPending,
  };
}
