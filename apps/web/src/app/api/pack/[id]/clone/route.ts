import { NextResponse } from 'next/server';

import z from 'zod';

import { clonePack } from '@/features/collection/api';
import { clonePackSchema } from '@/features/collection/schema';
import { withErrorHandling } from '@/lib/api-handlers';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const body = await request.json();
    const parsedBody = clonePackSchema.safeParse(body);

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

    const data = await clonePack(id, parsedBody.data);

    return NextResponse.json({ data }, { status: 200 });
  });
}
