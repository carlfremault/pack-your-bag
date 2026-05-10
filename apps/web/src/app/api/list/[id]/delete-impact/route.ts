import { NextResponse } from 'next/server';

import { getListDeleteImpact } from '@/features/collection/api';
import { withErrorHandling } from '@/lib/api-handlers';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const data = await getListDeleteImpact(id);

    return NextResponse.json({ data });
  });
}
