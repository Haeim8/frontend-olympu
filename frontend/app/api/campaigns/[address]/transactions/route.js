import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const rawAddress = params?.address;

  if (!rawAddress) {
    return NextResponse.json(
      { error: 'Missing campaign address' },
      { status: 400 },
    );
  }

  const address = rawAddress.toLowerCase();

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  const investorParam = searchParams.get('investor');

  let limit = 100;
  if (limitParam) {
    const parsed = Number.parseInt(limitParam, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      limit = Math.min(parsed, 500);
    }
  }

  try {
    let query = supabaseAdmin
      .from('campaign_transactions')
      .select('*')
      .eq('campaign_address', address)
      .order('block_number', { ascending: false })
      .limit(limit);

    if (investorParam) {
      query = query.eq('investor', investorParam.toLowerCase());
    }

    const { data, error } = await query;

    if (error) {
      console.error('[API] campaign transaction fetch error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transactions: data ?? [] });
  } catch (error) {
    console.error('[API] campaign transaction unexpected error', error);
    return NextResponse.json(
      { error: 'Unable to load transactions' },
      { status: 500 },
    );
  }
}
