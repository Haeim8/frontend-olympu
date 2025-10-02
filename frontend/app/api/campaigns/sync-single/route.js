import { NextResponse } from 'next/server';
import { syncSingleCampaign } from '@/lib/indexer/campaign-indexer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { address } = body || {};
    if (!address) {
      return NextResponse.json({ ok: false, error: 'Address is required' }, { status: 400 });
    }
    const result = await syncSingleCampaign(address);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('[API] sync-single error', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
