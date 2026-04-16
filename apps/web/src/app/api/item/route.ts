import { NextResponse } from 'next/server';

import { schemas } from '@repo/product-client';

import { createItem, getAllItems } from '@/features/item/api';
import { withErrorHandling } from '@/lib/api-handler';

export async function GET() {
  return withErrorHandling(async () => {
    const data = await getAllItems();

    return NextResponse.json({ data });
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const parsedBody = schemas.CreateItemDto.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid request body',
            status: 400,
            details: parsedBody.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    const data = await createItem(parsedBody.data);

    return NextResponse.json({ data }, { status: 201 });
  });
}
