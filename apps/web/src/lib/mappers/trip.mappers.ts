import type { TripCardProps } from '@repo/react-common/card';

import { TripSummary } from '@/features/trip/types';

function formatTripDate(isoDate: string, format: string): string {
  const [year, month, day] = isoDate.substring(0, 10).split('-');
  if (!year || !month || !day) return isoDate;
  return format.replace('YYYY', year).replace('MM', month).replace('DD', day);
}

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
    href: `/trip/${tripSummary.id}`,
    linkAs,
  };
}
