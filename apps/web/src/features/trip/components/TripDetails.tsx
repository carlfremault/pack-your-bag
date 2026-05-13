'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { LinkButton } from '@repo/react-common/button';
import { TripDetailsCard } from '@repo/react-common/card';

import { SidebarPortal } from '@/components/Sidebar';
import { getTotalItemQuantityInPack, getTotalWeightInPack } from '@/features/collection/utils';
import { usePreferences } from '@/features/settings/queries';
import { toTripDetailsCardProps } from '@/lib/mappers/trip.mappers';
import { formatWeightForDisplay } from '@/utils/weightUtils';

import { useTrip } from '../queries';
import { TripForDetailsCardDisplay } from '../types';
import { getCategoryItemsInPack, getTotalPackedItemQuantityInPack } from '../utils';

import TripContent from './TripContent';
import TripDeleteModal from './TripDeleteModal';

export interface TripDetailsProps {
  id: string;
}

export default function TripDetails(props: TripDetailsProps) {
  const { id } = props;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  const [deleteTripId, setDeleteTripId] = useState<string | null>(null);
  const { data: trip } = useTrip(id);
  const { data: preferences } = usePreferences();

  const tripForDetailsCardDisplay = useMemo((): TripForDetailsCardDisplay => {
    const totalWeight = trip.pack ? getTotalWeightInPack(trip.pack) : 0;
    const { value, unit } = formatWeightForDisplay(totalWeight, preferences?.units);
    const numberOfItems = trip.pack ? getTotalItemQuantityInPack(trip.pack) : 0;
    const numberOfItemsPacked = trip.pack ? getTotalPackedItemQuantityInPack(trip.pack) : 0;
    const categoryItems = trip.pack ? getCategoryItemsInPack(trip.pack) : [];

    return {
      ...trip,
      numberOfItems,
      numberOfItemsPacked,
      categoryItems,
      displayWeight: value,
      displayUnit: unit,
    };
  }, [trip, preferences?.units]);

  const handleEditTrip = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('action', 'edit-trip');
    params.set('id', id);
    router.replace(`${pathname}?${params.toString()}`);
  }, [id, pathname, router, searchParams]);

  const handleDeleteTrip = () => {
    setDeleteTripId(id);
  };

  const closeDeleteModal = () => {
    setDeleteTripId(null);
  };

  const tripDeleteModal = deleteTripId && (
    <TripDeleteModal tripId={deleteTripId} onClose={closeDeleteModal} />
  );

  const detailsCardProps = toTripDetailsCardProps(
    tripForDetailsCardDisplay,
    {
      onEditTrip: handleEditTrip,
      onDeleteTrip: handleDeleteTrip,
    },
    preferences?.dateFormat,
  );

  const tripDetailsContent = <TripDetailsCard {...detailsCardProps} />;
  const tripContent = trip.pack ? (
    <TripContent tripId={trip.id} pack={trip.pack} />
  ) : (
    <div className="bg-surface border-primary-ring text-primary rounded-md border p-6 text-center text-sm">
      <p>No pack selected yet for this trip</p>
    </div>
  );

  return (
    <div className="flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-4 p-4">
      {/* Mobile */}
      <div className="flex flex-col gap-4 lg:hidden">{tripDetailsContent}</div>
      {/* Desktop */}
      {!action && (
        <SidebarPortal>
          <div className="flex min-h-0 flex-1 flex-col justify-center gap-4">
            {tripDetailsContent}
            <LinkButton href="/trips" variant="outline" linkAs={Link} className="w-full">
              Back
            </LinkButton>
          </div>
        </SidebarPortal>
      )}
      {tripContent}
      {tripDeleteModal}
    </div>
  );
}
