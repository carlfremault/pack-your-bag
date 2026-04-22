import { NextResponse } from 'next/server';

import z from 'zod';

import { createCategory, getAllCategories } from '@/features/category/api';
import { createCategorySchema } from '@/features/category/schema';
import { withErrorHandling } from '@/lib/api-handler';

export async function GET() {
  return withErrorHandling(async () => {
    const data = await getAllCategories();

    return NextResponse.json({ data });
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const parsedBody = createCategorySchema.safeParse(body);

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

    const data = await createCategory(parsedBody.data);

    return NextResponse.json({ data }, { status: 201 });
  });
}
