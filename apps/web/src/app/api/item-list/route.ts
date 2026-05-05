import { NextResponse } from 'next/server';

import z from 'zod';

import { upsertItemOnList } from '@/features/collection/api';
import { upsertItemListSchema } from '@/features/collection/schema';
import { withErrorHandling } from '@/lib/api-handlers';

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const parsedBody = upsertItemListSchema.safeParse(body);

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

    const data = await upsertItemOnList(parsedBody.data);

    return NextResponse.json({ data }, { status: 201 });
  });
}
