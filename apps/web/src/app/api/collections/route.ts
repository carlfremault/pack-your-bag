import { NextResponse } from 'next/server';

import { getAllCollections } from '@/features/collection/api';
import { withErrorHandling } from '@/lib/api-handlers';

export async function GET() {
  return withErrorHandling(async () => {
    const data = await getAllCollections();

    return NextResponse.json({ data });
  });
}
