import type { TripCardProps, TripDetailsCardProps } from '@repo/react-common/card';
import { ColorTheme } from '@repo/react-common/color-themes';

import { TripForDetailsCardDisplay, TripSummary } from '@/features/trip/types';
import { formatTripDate } from '@/features/trip/utils';

export function toTripCardProps(
  tripSummary: TripSummary,
  linkAs?: React.ElementType,
  dateFormat?: string,
): TripCardProps {
  const rawDate = tripSummary.date ? tripSummary.date.substring(0, 10) : undefined;

  return {
    id: tripSummary.id,
    name: tripSummary.name,
    date: rawDate && dateFormat ? formatTripDate(rawDate, dateFormat) : rawDate,
    remarks: tripSummary.remarks ?? undefined,
    packName: tripSummary.pack?.name,
    packColorTheme: tripSummary.pack?.colorTheme ?? undefined,
    numberOfItems: tripSummary.pack?.itemCount ?? 0,
    numberOfItemsPacked: tripSummary.packedItemCount,
    href: `/trips/${tripSummary.id}`,
    linkAs,
  };
}

export function toTripDetailsCardProps(
  trip: TripForDetailsCardDisplay,
  handlers: Pick<TripDetailsCardProps, 'onEditTrip' | 'onDeleteTrip'>,
  dateFormat?: string,
): TripDetailsCardProps {
  const rawDate = trip.date ? trip.date.substring(0, 10) : undefined;

  return {
    id: trip.id,
    name: trip.name,
    date: rawDate && dateFormat ? formatTripDate(rawDate, dateFormat) : rawDate,
    remarks: trip.remarks ?? undefined,
    packName: trip.pack?.name,
    packColorTheme: trip.pack?.colorTheme as ColorTheme,
    numberOfItems: trip.numberOfItems,
    numberOfItemsPacked: trip.numberOfItemsPacked,
    totalWeight: trip.displayWeight,
    weightUnit: trip.displayUnit,
    categoryItems: trip.categoryItems,
    ...handlers,
  };
}
