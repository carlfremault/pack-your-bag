import { NextResponse } from 'next/server';

import z from 'zod';

import { updateTripItemStatus } from '@/features/trip/api';
import { updateTripItemStatusSchema } from '@/features/trip/schema';
import { withErrorHandling } from '@/lib/api-handlers';

const paramsSchema = z.object({
  id: z.uuid(),
  itemId: z.uuid(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const parsedParams = paramsSchema.safeParse(await params);
    const parsedBody = updateTripItemStatusSchema.safeParse(body);

    if (!parsedParams.success) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

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

    const { id, itemId } = parsedParams.data;

    await updateTripItemStatus(id, itemId, parsedBody.data);

    return new NextResponse(null, { status: 204 });
  });
}
