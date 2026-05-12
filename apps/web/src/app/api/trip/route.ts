import { NextResponse } from 'next/server';

import z from 'zod';

import { createTrip, getAllTrips } from '@/features/trip/api';
import { createTripSchema } from '@/features/trip/schema';
import { withErrorHandling } from '@/lib/api-handlers';

export async function GET() {
  return withErrorHandling(async () => {
    const data = await getAllTrips();

    return NextResponse.json({ data });
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const parsedBody = createTripSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid request body',
            status: 400,
            details: z.treeifyError(parsedBody.error),
          },
        },
        { status: 400 },
      );
    }

    const data = await createTrip(parsedBody.data);

    return NextResponse.json({ data }, { status: 201 });
  });
}
