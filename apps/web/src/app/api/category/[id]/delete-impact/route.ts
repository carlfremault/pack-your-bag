import { NextResponse } from 'next/server';

import { getCategoryDeleteImpact } from '@/features/category/api';
import { withErrorHandling } from '@/lib/api-handlers';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const data = await getCategoryDeleteImpact(id);

    return NextResponse.json({ data });
  });
}
