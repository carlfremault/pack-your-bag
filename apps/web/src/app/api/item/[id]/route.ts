import { NextResponse } from 'next/server';

import { getItem } from '@/features/items/api';
import { withErrorHandling } from '@/lib/api-handler';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  console.log('*** DEMO *** Web - route handler - getItem ...');
  return withErrorHandling(async () => {
    const { id } = await params;
    const data = await getItem(id);

    return NextResponse.json({ data });
  });
}
