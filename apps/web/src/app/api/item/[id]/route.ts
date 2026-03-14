import { NextResponse } from 'next/server';

import { getItem } from '@/features/items/api';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { id } = await params;
  const { data, error, response } = await getItem(id);

  if (error) {
    const status = response?.status ?? 500;
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ data });
}
