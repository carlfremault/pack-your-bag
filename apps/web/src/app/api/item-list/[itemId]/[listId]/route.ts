import { NextResponse } from 'next/server';

import { z } from 'zod';

import { removeItemFromList } from '@/features/collection/api';
import { withErrorHandling } from '@/lib/api-handlers';

const paramsSchema = z.object({
  itemId: z.uuid(),
  listId: z.uuid(),
});

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ itemId: string; listId: string }> },
) {
  return withErrorHandling(async () => {
    const parsed = paramsSchema.safeParse(await params);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const { itemId, listId } = parsed.data;

    await removeItemFromList(itemId, listId);

    return new NextResponse(null, { status: 204 });
  });
}
