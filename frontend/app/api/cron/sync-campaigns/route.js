import { NextResponse } from 'next/server';

import { syncCampaigns } from '@/lib/indexer/campaign-indexer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  } else {
    const isCronRequest = request.headers.get('x-vercel-cron');
    if (!isCronRequest) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  try {
    const result = await syncCampaigns();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('[Cron] sync-campaigns error', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
