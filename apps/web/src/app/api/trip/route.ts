import { NextResponse } from 'next/server';

import { getAllTrips } from '@/features/trip/api';
import { withErrorHandling } from '@/lib/api-handlers';

export async function GET() {
  return withErrorHandling(async () => {
    const data = await getAllTrips();

    return NextResponse.json({ data });
  });
}
