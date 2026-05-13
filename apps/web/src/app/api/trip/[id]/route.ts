import { NextResponse } from 'next/server';

import z from 'zod';

import { getTrip, updateTrip } from '@/features/trip/api';
import { updateTripSchema } from '@/features/trip/schema';
import { withErrorHandling } from '@/lib/api-handlers';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;

    const data = await getTrip(id);

    return NextResponse.json({ data });
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const body = await request.json();
    const parsedBody = updateTripSchema.safeParse(body);

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

    const data = await updateTrip(id, parsedBody.data);

    return NextResponse.json({ data }, { status: 200 });
  });
}
