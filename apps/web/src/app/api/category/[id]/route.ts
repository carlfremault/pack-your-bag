import { NextResponse } from 'next/server';

import z from 'zod';

import { deleteCategory, updateCategory } from '@/features/category/api';
import { updateCategorySchema } from '@/features/category/schema';
import { withErrorHandling } from '@/lib/api-handlers';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const body = await request.json();
    const parsedBody = updateCategorySchema.safeParse(body);

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

    const data = await updateCategory(id, parsedBody.data);

    return NextResponse.json({ data }, { status: 200 });
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;

    await deleteCategory(id);

    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
  });
}
