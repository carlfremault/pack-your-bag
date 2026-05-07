import { NextResponse } from 'next/server';

import z from 'zod';

import { deleteItem, updateItem } from '@/features/item/api';
import { updateItemSchema } from '@/features/item/schema';
import { withErrorHandling } from '@/lib/api-handlers';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const body = await request.json();
    const parsedBody = updateItemSchema.safeParse(body);

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

    const data = await updateItem(id, parsedBody.data);

    return NextResponse.json({ data }, { status: 200 });
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;

    await deleteItem(id);

    return new NextResponse(null, { status: 204 });
  });
}
