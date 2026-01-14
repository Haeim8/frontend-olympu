import { NextResponse } from 'next/server';
import { campaigns as dbCampaigns } from '@/backend/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const creator = searchParams.get('creator');

  try {
    let campaignList = await dbCampaigns.getAll({ status, category });

    if (creator) {
      campaignList = campaignList.filter(c => c.creator?.toLowerCase() === creator.toLowerCase());
    }

    console.log(`[API] ✅ ${campaignList.length} campagnes depuis Supabase`);

    return NextResponse.json(
      { campaigns: campaignList },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      },
    );
  } catch (error) {
    console.error('[API] Error fetching campaigns:', error);

    return NextResponse.json(
      {
        campaigns: [],
        error: 'Impossible de récupérer les campagnes.',
      },
      { status: 200 },
    );
  }
}
