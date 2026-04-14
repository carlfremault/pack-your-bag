import { NextResponse } from 'next/server';

import { getAllItems } from '@/features/item/api';
import { withErrorHandling } from '@/lib/api-handler';

export async function GET() {
  return withErrorHandling(async () => {
    const data = await getAllItems();

    return NextResponse.json({ data });
  });
}
