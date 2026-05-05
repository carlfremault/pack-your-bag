import { NextResponse } from 'next/server';

import { z } from 'zod';

import { removeItemFromPack } from '@/features/collection/api';
import { withErrorHandling } from '@/lib/api-handlers';

const paramsSchema = z.object({
  itemId: z.uuid(),
  packId: z.uuid(),
});

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ itemId: string; packId: string }> },
) {
  return withErrorHandling(async () => {
    const parsed = paramsSchema.safeParse(await params);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const { itemId, packId } = parsed.data;

    await removeItemFromPack(itemId, packId);

    return new NextResponse(null, { status: 204 });
  });
}
