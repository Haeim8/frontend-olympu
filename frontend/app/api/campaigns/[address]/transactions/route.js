import { NextResponse } from 'next/server';
import { transactions as dbTransactions } from '@/backend/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const rawAddress = params?.address;

  if (!rawAddress) {
    return NextResponse.json({ error: 'Missing campaign address' }, { status: 400 });
  }

  const address = rawAddress.toLowerCase();
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');

  let limit = 100;
  if (limitParam) {
    const parsed = Number.parseInt(limitParam, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      limit = Math.min(parsed, 500);
    }
  }

  let offset = 0;
  if (offsetParam) {
    const parsed = Number.parseInt(offsetParam, 10);
    if (Number.isFinite(parsed) && parsed >= 0) {
      offset = parsed;
    }
  }

  try {
    // Récupérer depuis Supabase
    const txList = await dbTransactions.getByCampaign(address, { limit, offset });
    return NextResponse.json({ transactions: txList });
  } catch (error) {
    console.error('[API] Error fetching transactions:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
