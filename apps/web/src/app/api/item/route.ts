import { NextResponse } from 'next/server';

import { getItems } from '@/features/items/api';
import { withErrorHandling } from '@/lib/api-handler';

export async function GET() {
  console.log('*** DEMO *** Web - route handler - getItems ...');
  return withErrorHandling(async () => {
    const data = await getItems();

    return NextResponse.json({ data });
  });
}
