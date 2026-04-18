import { NextResponse } from 'next/server';

import { createItem, getAllItems } from '@/features/item/api';
import { createItemSchema } from '@/features/item/schema';
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
    const parsedBody = createItemSchema.safeParse(body);

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
