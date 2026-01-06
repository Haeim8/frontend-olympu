import { NextResponse } from 'next/server';
import { transactions as dbTransactions } from '@/backend/db';
import { transactionCache } from '@/backend/redis';

export const runtime = 'nodejs';
export const revalidate = 30;

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
    // Vérifier le cache Redis (uniquement si pas d'offset pour simplifier)
    if (offset === 0) {
      const cached = await transactionCache.get(address);
      if (cached) {
        console.log('[API] Cache hit: transactions', address);
        return NextResponse.json({ transactions: cached.slice(0, limit) });
      }
    }

    // Récupérer depuis PostgreSQL
    const txList = await dbTransactions.getByCampaign(address, { limit, offset });

    // Mettre en cache (si c'est la première page)
    if (offset === 0 && txList.length > 0) {
      await transactionCache.set(address, txList);
    }

    return NextResponse.json({ transactions: txList });
  } catch (error) {
    console.error('[API] Error fetching transactions:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
