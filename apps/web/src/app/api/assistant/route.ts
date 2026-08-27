import { NextResponse } from 'next/server';

import z from 'zod';

import { fetchPackingList } from '@/features/assistant/generate';
import { assistantFormSchema } from '@/features/assistant/schema';
import { withErrorHandling } from '@/lib/api-handlers';

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const parsedBody = assistantFormSchema.safeParse(body);

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

    const data = await fetchPackingList(parsedBody.data);

    return NextResponse.json({ data }, { status: 201 });
  });
}
